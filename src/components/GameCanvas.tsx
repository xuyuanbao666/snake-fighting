import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, PanResponder, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Orientation from 'react-native-orientation-locker';
import { RootState } from '../store';
import {
  growSnake,
  setFoods,
  addFood,
  removeFood,
  addScore,
  incrementFoodEaten,
  setPlaying,
  setPaused,
  updateSnakeBody,
  toggleOrientation,
  DIFFICULTY_CONFIG,
} from '../store/gameSlice';
import { Snake } from '../engine/Snake';
import { AISnake, createAISnakes, spawnSingleAI } from '../engine/AISnake';
import { Food } from '../engine/Food';
import { Collision } from '../engine/Collision';
import { GameLoop } from '../engine/GameLoop';
import { TrapManager, PoisonFog, ActiveBuff, BuffType, BUFF_CONFIG, getRandomBuff } from '../engine/Hazard';
import { FoodType, FOOD_CONFIG, THEME_COLORS, GRID_SIZE } from '../utils/constants';
import { soundManager } from '../utils/sound';
import { Storage } from '../utils/storage';
import { GameRenderer } from './GameRenderer';
import { RealtimeRanking } from './RealtimeRanking';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const JOYSTICK_RADIUS = 60;
const KNOB_RADIUS = 22;

const FOOD_LIMITS = {
  [FoodType.STAR]: { min: 8, max: 12 },
  [FoodType.APPLE]: { min: 3, max: 5 },
  [FoodType.DIAMOND]: { min: 1, max: 2 },
};

export const GameCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const snakeRef = useRef<Snake>(new Snake());
  const aiSnakesRef = useRef<AISnake[]>([]);
  const foodRef = useRef<Food>(new Food());
  const gameLoopRef = useRef<GameLoop | null>(null);
  const trapManagerRef = useRef<TrapManager>(new TrapManager());
  const poisonFogRef = useRef<PoisonFog | null>(null);

  const { snake, foods, isPlaying, isPaused, theme, difficulty, gameMode, orientation } = useSelector(
    (state: RootState) => state.game,
  );

  const foodsRef = useRef(foods);
  const isShieldedRef = useRef(snake.isShielded);
  const [aiSnakesData, setAiSnakesData] = useState<{ body: { x: number; y: number }[]; color: string; name: string }[]>([]);
  const [rankingData, setRankingData] = useState<{ name: string; length: number; color: string; isPlayer: boolean }[]>([]);
  const [trapsData, setTrapsData] = useState<{ x: number; y: number; type: string; radius: number }[]>([]);
  const [fogData, setFogData] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>([]);
  const [killFeed, setKillFeed] = useState<{ text: string; time: number }[]>([]);
  const [snakeBodyForRender, setSnakeBodyForRender] = useState<{ x: number; y: number }[]>([]);
  const activeBuffsRef = useRef<ActiveBuff[]>([]);
  const baseSpeedRef = useRef(0.15);
  const aiConfigRef = useRef({ speed: 0.09, intelligence: 0.3 });

  // Floating joystick state
  const [joystickCenter, setJoystickCenter] = useState({ x: 0, y: 0 });
  const [joystickKnob, setJoystickKnob] = useState({ x: 0, y: 0 });
  const [joystickVisible, setJoystickVisible] = useState(false);

  useEffect(() => { foodsRef.current = foods; }, [foods]);
  useEffect(() => { isShieldedRef.current = snake.isShielded; }, [snake.isShielded]);

  const getAllOccupiedPositions = useCallback(() => [
    ...snakeRef.current.body.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
    ...aiSnakesRef.current.filter(s => s.alive).flatMap(s => s.body.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))),
    ...foodsRef.current.map(f => f.position),
  ], []);

  const spawnFoods = useCallback(() => {
    const occupied = getAllOccupiedPositions();
    const newFoods: { position: { x: number; y: number }; type: FoodType }[] = [];
    const counts = { [FoodType.STAR]: 0, [FoodType.APPLE]: 0, [FoodType.DIAMOND]: 0 };
    for (const f of foodsRef.current) counts[f.type]++;
    for (const [type, limits] of Object.entries(FOOD_LIMITS)) {
      const foodType = type as FoodType;
      const target = limits.min + Math.floor(Math.random() * (limits.max - limits.min + 1));
      const toSpawn = target - counts[foodType];
      for (let i = 0; i < toSpawn; i++) {
        try {
          const pos = foodRef.current.generate([...occupied, ...newFoods.map(f => f.position)]);
          newFoods.push({ position: pos, type: foodType });
        } catch (e) { break; }
      }
    }
    if (newFoods.length > 0) dispatch(setFoods([...foodsRef.current, ...newFoods]));
  }, [dispatch, getAllOccupiedPositions]);

  const spawnFoodsRef = useRef(spawnFoods);
  useEffect(() => { spawnFoodsRef.current = spawnFoods; }, [spawnFoods]);

  const updateRanking = useCallback(() => {
    setRankingData([
      { name: '你', length: snakeRef.current.body.length, color: THEME_COLORS[theme].snake, isPlayer: true },
      ...aiSnakesRef.current.filter(s => s.alive).map(s => ({ name: s.name, length: s.getLength(), color: s.color, isPlayer: false })),
    ]);
  }, [theme]);

  const handleGameUpdate = useCallback(() => {
    const currentFoods = foodsRef.current;
    const isImpossible = difficulty === 'impossible';

    if (isImpossible && poisonFogRef.current) {
      poisonFogRef.current.update();
      trapManagerRef.current.update(snakeRef.current.body, aiSnakesRef.current.filter(s => s.alive).map(s => s.body));
      const head = snakeRef.current.getHead();
      if (!poisonFogRef.current.isInSafeZone(head)) {
        gameLoopRef.current?.stop();
        const score = Math.max(0, snakeRef.current.body.length - 5);
        Storage.addToLeaderboard({ score, length: snakeRef.current.body.length, date: new Date().toISOString(), theme });
        dispatch(setPlaying(false)); soundManager.play('gameOver'); return;
      }
      const hitTrap = trapManagerRef.current.checkCollision(head);
      if (hitTrap) {
        if (hitTrap.type === 'spike') {
          gameLoopRef.current?.stop();
          const score = Math.max(0, snakeRef.current.body.length - 5);
          Storage.addToLeaderboard({ score, length: snakeRef.current.body.length, date: new Date().toISOString(), theme });
          dispatch(setPlaying(false)); soundManager.play('gameOver'); return;
        } else if (hitTrap.type === 'slow') { baseSpeedRef.current = Math.min(0.25, baseSpeedRef.current + 0.02); }
        else if (hitTrap.type === 'poison' && snakeRef.current.body.length > 5) { snakeRef.current.body.pop(); snakeRef.current.body.pop(); }
      }
      setTrapsData(trapManagerRef.current.traps.filter(t => t.active).map(t => ({ x: t.position.x, y: t.position.y, type: t.type, radius: t.radius })));
      setFogData({ minX: poisonFogRef.current.minX, minY: poisonFogRef.current.minY, maxX: poisonFogRef.current.maxX, maxY: poisonFogRef.current.maxY });
    }

    const foodPositions = currentFoods.map(f => f.position);
    for (const ai of aiSnakesRef.current) {
      if (!ai.alive) continue;
      if (isImpossible) {
        const aiHead = ai.getHead();
        const nearTrap = trapManagerRef.current.traps.find(t => t.active && Math.abs(t.position.x - aiHead.x) < 3 && Math.abs(t.position.y - aiHead.y) < 3);
        if (nearTrap) { const dx = aiHead.x - nearTrap.position.x; const dy = aiHead.y - nearTrap.position.y; const dist = Math.sqrt(dx * dx + dy * dy) || 1; ai.velocityX = dx / dist; ai.velocityY = dy / dist; }
      }
      ai.update(foodPositions, snakeRef.current.getHead(), snakeRef.current.body);
      // Endless mode: AI wraps around instead of dying on walls
      if (gameMode === 'endless' && ai.alive) {
        const aiHead = ai.body[0];
        if (aiHead.x < 0) aiHead.x = GRID_SIZE - 1;
        else if (aiHead.x >= GRID_SIZE) aiHead.x = 0;
        if (aiHead.y < 0) aiHead.y = GRID_SIZE - 1;
        else if (aiHead.y >= GRID_SIZE) aiHead.y = 0;
      }
      const aiHead = { x: Math.round(ai.getHead().x), y: Math.round(ai.getHead().y) };
      for (let fi = 0; fi < currentFoods.length; fi++) {
        if (Collision.checkFoodCollision(aiHead, currentFoods[fi].position)) {
          const foodConfig = FOOD_CONFIG[currentFoods[fi].type];
          for (let g = 0; g < foodConfig.growth; g++) ai.grow();
          dispatch(removeFood(fi)); break;
        }
      }
      const aiHeadPos = ai.getHead();
      for (let pi = 1; pi < snakeRef.current.body.length; pi++) {
        const seg = snakeRef.current.body[pi];
        if ((aiHeadPos.x - seg.x) ** 2 + (aiHeadPos.y - seg.y) ** 2 < 0.8) {
          ai.alive = false;
          const buffType = getRandomBuff();
          activeBuffsRef.current.push({ type: buffType, duration: BUFF_CONFIG[buffType].duration, startTime: Date.now() });
          setActiveBuffs([...activeBuffsRef.current]);
          setKillFeed(prev => [...prev.slice(-4), { text: `击杀 ${ai.name}! ${BUFF_CONFIG[buffType].emoji} ${BUFF_CONFIG[buffType].label}`, time: Date.now() }]); break;
        }
      }
      if (ai.alive) {
        for (const otherAi of aiSnakesRef.current) {
          if (otherAi === ai || !otherAi.alive) continue;
          for (let pi = 0; pi < otherAi.body.length; pi++) {
            if ((aiHeadPos.x - otherAi.body[pi].x) ** 2 + (aiHeadPos.y - otherAi.body[pi].y) ** 2 < 0.8) { ai.alive = false; break; }
          }
          if (!ai.alive) break;
        }
      }
      if (ai.justDied) {
        const buffType = getRandomBuff();
        activeBuffsRef.current.push({ type: buffType, duration: BUFF_CONFIG[buffType].duration, startTime: Date.now() });
        setActiveBuffs([...activeBuffsRef.current]);
        setKillFeed(prev => [...prev.slice(-4), { text: `${ai.name} 撞墙! ${BUFF_CONFIG[buffType].emoji} ${BUFF_CONFIG[buffType].label}`, time: Date.now() }]);
      }
    }

    // Endless mode: respawn dead AI to maintain 10
    if (gameMode === 'endless') {
      const deadAIs = aiSnakesRef.current.filter(a => !a.alive);
      for (const dead of deadAIs) {
        const idx = aiSnakesRef.current.indexOf(dead);
        const playerHead = snakeRef.current.getHead();
        aiSnakesRef.current[idx] = spawnSingleAI(aiConfigRef.current, idx, playerHead.x, playerHead.y);
      }
    }

    activeBuffsRef.current = activeBuffsRef.current.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);
    setActiveBuffs([...activeBuffsRef.current]);
    const hasShield = activeBuffsRef.current.some(b => b.type === 'shield');
    const hasSpeed = activeBuffsRef.current.some(b => b.type === 'speed');
    const hasDoubleScore = activeBuffsRef.current.some(b => b.type === 'doubleScore');
    isShieldedRef.current = snake.isShielded || hasShield;
    snakeRef.current.speed = hasSpeed ? baseSpeedRef.current * 1.5 : baseSpeedRef.current;

    snakeRef.current.move();

    // Wall collision: classic mode = death, endless mode = wrap around
    if (snakeRef.current.checkWallCollision()) {
      if (gameMode === 'endless') {
        // Wrap around
        const head = snakeRef.current.body[0];
        if (head.x < 0) head.x = GRID_SIZE - 1;
        else if (head.x >= GRID_SIZE) head.x = 0;
        if (head.y < 0) head.y = GRID_SIZE - 1;
        else if (head.y >= GRID_SIZE) head.y = 0;
      } else if (!isShieldedRef.current) {
        gameLoopRef.current?.stop();
        const score = Math.max(0, snakeRef.current.body.length - 5);
        Storage.addToLeaderboard({ score, length: snakeRef.current.body.length, date: new Date().toISOString(), theme });
        dispatch(setPlaying(false)); soundManager.play('gameOver'); return;
      }
    }

    const playerHead = snakeRef.current.getHead();
    for (const ai of aiSnakesRef.current) {
      if (!ai.alive) continue;
      for (let pi = 0; pi < ai.body.length; pi++) {
        if ((playerHead.x - ai.body[pi].x) ** 2 + (playerHead.y - ai.body[pi].y) ** 2 < 0.8 && !isShieldedRef.current) {
          gameLoopRef.current?.stop();
          const score = Math.max(0, snakeRef.current.body.length - 5);
          Storage.addToLeaderboard({ score, length: snakeRef.current.body.length, date: new Date().toISOString(), theme });
          dispatch(setPlaying(false)); soundManager.play('gameOver'); return;
        }
      }
    }

    setSnakeBodyForRender(snakeRef.current.body.map(p => ({ x: p.x, y: p.y })));
    const head = snakeRef.current.getHead();
    const headGrid = { x: Math.round(head.x), y: Math.round(head.y) };
    let ate = false;
    let ateIndex = -1;
    let ateType = FoodType.STAR;
    for (let fi = 0; fi < currentFoods.length; fi++) {
      if (Collision.checkFoodCollision(headGrid, currentFoods[fi].position)) {
        const foodConfig = FOOD_CONFIG[currentFoods[fi].type];
        for (let g = 0; g < foodConfig.growth; g++) { snakeRef.current.grow(); }
        ate = true; ateIndex = fi; ateType = currentFoods[fi].type; break;
      }
    }
    if (ate) {
      setSnakeBodyForRender(snakeRef.current.body.map(p => ({ x: p.x, y: p.y })));
      dispatch(updateSnakeBody(snakeRef.current.body.map(p => ({ x: p.x, y: p.y }))));
      dispatch(addScore(hasDoubleScore ? FOOD_CONFIG[ateType].points * 2 : FOOD_CONFIG[ateType].points));
      dispatch(incrementFoodEaten()); soundManager.play('eat');
      dispatch(removeFood(ateIndex));
      spawnFoodsRef.current();
    } else if (currentFoods.length < 8) {
      spawnFoodsRef.current();
    }
    setAiSnakesData(aiSnakesRef.current.filter(s => s.alive).map(s => ({ body: s.body.map(p => ({ ...p })), color: s.color, name: s.name })));
    updateRanking();
  }, [dispatch, theme, updateRanking, difficulty, gameMode]);

  const handleGameUpdateRef = useRef(handleGameUpdate);
  useEffect(() => { handleGameUpdateRef.current = handleGameUpdate; }, [handleGameUpdate]);

  const prevIsPlaying = useRef(false);
  const prevIsPaused = useRef(false);

  useEffect(() => {
    const wasPlaying = prevIsPlaying.current;
    const wasPaused = prevIsPaused.current;
    prevIsPlaying.current = isPlaying;
    prevIsPaused.current = isPaused;
    if (!isPlaying) { gameLoopRef.current?.stop(); return; }
    if (isPaused) { gameLoopRef.current?.stop(); return; }
    if (!wasPlaying) {
      const diffConfig = DIFFICULTY_CONFIG[difficulty];
      snakeRef.current = new Snake();
      snakeRef.current.speed = diffConfig.playerSpeed;
      baseSpeedRef.current = diffConfig.playerSpeed;
      const aiCount = gameMode === 'endless' ? 10 : diffConfig.aiCount;
      const aiConfig = gameMode === 'endless'
        ? { speed: diffConfig.aiSpeed * 1.3, intelligence: Math.min(1, diffConfig.aiIntelligence + 0.3) }
        : { speed: diffConfig.aiSpeed, intelligence: diffConfig.aiIntelligence };
      aiSnakesRef.current = createAISnakes(aiCount, aiConfig);
      aiConfigRef.current = aiConfig;
      if (difficulty === 'impossible') { trapManagerRef.current = new TrapManager(); poisonFogRef.current = new PoisonFog(); }
      else { poisonFogRef.current = null; setTrapsData([]); setFogData(null); }
      activeBuffsRef.current = []; setActiveBuffs([]); setKillFeed([]);
      setSnakeBodyForRender(snakeRef.current.body.map(p => ({ x: p.x, y: p.y })));
      dispatch(updateSnakeBody(snakeRef.current.body.map(p => ({ x: p.x, y: p.y }))));
      spawnFoodsRef.current();
    }
    gameLoopRef.current?.stop();
    gameLoopRef.current = new GameLoop(() => handleGameUpdateRef.current(), 16);
    gameLoopRef.current.start();
    return () => { gameLoopRef.current?.stop(); };
  }, [isPlaying, isPaused, dispatch, difficulty]);

  // Floating joystick - appears where finger touches
  const joystickPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => {
        // Only capture touches in the bottom half of screen
        return evt.nativeEvent.pageY > screenHeight * 0.4;
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        setJoystickCenter({ x: pageX, y: pageY });
        setJoystickKnob({ x: 0, y: 0 });
        setJoystickVisible(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = JOYSTICK_RADIUS - KNOB_RADIUS;
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        setJoystickKnob({
          x: Math.cos(angle) * clampedDist,
          y: Math.sin(angle) * clampedDist,
        });
        if (dist > 15) snakeRef.current.setDirectionFromAngle(angle);
      },
      onPanResponderRelease: () => {
        setJoystickVisible(false);
        setJoystickKnob({ x: 0, y: 0 });
      },
    }),
  ).current;

  const handlePauseToggle = useCallback(() => { dispatch(setPaused(!isPaused)); }, [dispatch, isPaused]);
  const handleBackToLobby = useCallback(() => { gameLoopRef.current?.stop(); dispatch(setPlaying(false)); dispatch(setPaused(false)); }, [dispatch]);
  const handleOrientationToggle = useCallback(() => {
    dispatch(toggleOrientation());
    setTimeout(() => {
      if (orientation === 'portrait') Orientation.lockToLandscape();
      else Orientation.lockToPortrait();
    }, 50);
  }, [dispatch, orientation]);

  const colors = THEME_COLORS[theme];
  const score = Math.max(0, snake.body.length - 5);

  return (
    <View style={styles.container} {...joystickPanResponder.panHandlers}>
      {/* Fullscreen game board */}
      <View style={styles.gameBoard}>
        <GameRenderer snakeBody={snakeBodyForRender} foods={foods} theme={theme} aiSnakes={aiSnakesData} traps={trapsData} fog={fogData} />
      </View>

      {/* HUD overlay - top */}
      <View style={styles.topHud}>
        <TouchableOpacity style={styles.hudBtn} onPress={handleBackToLobby}>
          <Text style={styles.hudBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
        <View style={styles.topRightBtns}>
          <TouchableOpacity style={[styles.hudBtn, { backgroundColor: 'rgba(0,0,0,0.35)' }]} onPress={handleOrientationToggle}>
            <Text style={styles.hudBtnText}>{orientation === 'portrait' ? '📺' : '📱'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.hudBtn, { marginLeft: 8 }]} onPress={handlePauseToggle}>
            <Text style={styles.hudBtnText}>{isPaused ? '▶' : '⏸'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ranking overlay */}
      <RealtimeRanking entries={rankingData} />

      {/* Buffs overlay */}
      {activeBuffs.length > 0 && (
        <View style={styles.buffBar}>
          {activeBuffs.map((buff, i) => {
            const config = BUFF_CONFIG[buff.type];
            const progress = buff.duration / config.duration;
            return (
              <View key={i} style={[styles.buffItem, { backgroundColor: config.color + '30', borderColor: config.color }]}>
                <Text style={styles.buffEmoji}>{config.emoji}</Text>
                <View style={[styles.buffProgress, { width: `${progress * 100}%`, backgroundColor: config.color }]} />
              </View>
            );
          })}
        </View>
      )}

      {/* Kill feed */}
      {killFeed.length > 0 && (
        <View style={styles.killFeed}>
          {killFeed.slice(-3).map((kill) => (
            <Text key={kill.time} style={styles.killText}>{kill.text}</Text>
          ))}
        </View>
      )}

      {/* Floating joystick */}
      {joystickVisible && (
        <View style={[styles.joystickBase, { left: joystickCenter.x - JOYSTICK_RADIUS, top: joystickCenter.y - JOYSTICK_RADIUS }]}>
          <View style={[styles.joystickKnob, {
            left: JOYSTICK_RADIUS - KNOB_RADIUS + joystickKnob.x,
            top: JOYSTICK_RADIUS - KNOB_RADIUS + joystickKnob.y,
            backgroundColor: colors.snake,
          }]} />
        </View>
      )}

      {/* Pause overlay */}
      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseEmoji}>⏸</Text>
            <Text style={styles.pauseTitle}>暂停</Text>
            <TouchableOpacity style={[styles.pauseBtn, { backgroundColor: colors.snake }]} onPress={handlePauseToggle}>
              <Text style={styles.pauseBtnText}>继续游戏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.lobbyBtn} onPress={handleBackToLobby}>
              <Text style={styles.lobbyBtnText}>返回大厅</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gameBoard: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topHud: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
  },
  topRightBtns: { flexDirection: 'row', alignItems: 'center' },
  hudBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  hudBtnText: { fontSize: 17, color: '#FFF', fontWeight: '700' },
  scoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 22, paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  scoreText: { fontSize: 24, fontWeight: '800', color: '#333' },
  joystickBase: {
    position: 'absolute',
    width: JOYSTICK_RADIUS * 2,
    height: JOYSTICK_RADIUS * 2,
    borderRadius: JOYSTICK_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  joystickKnob: {
    position: 'absolute',
    width: KNOB_RADIUS * 2,
    height: KNOB_RADIUS * 2,
    borderRadius: KNOB_RADIUS,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  pauseOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  pauseCard: {
    borderRadius: 24, paddingVertical: 32, paddingHorizontal: 28, alignItems: 'center',
    backgroundColor: '#FFF', width: Math.min(screenWidth * 0.75, 300),
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  pauseEmoji: { fontSize: 48, marginBottom: 12 },
  pauseTitle: { fontSize: 26, fontWeight: '700', color: '#333', marginBottom: 24 },
  pauseBtn: { width: '100%', height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  pauseBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  lobbyBtn: { paddingVertical: 8 },
  lobbyBtnText: { fontSize: 15, color: '#999', fontWeight: '500' },
  buffBar: { position: 'absolute', top: 100, right: 12, flexDirection: 'column', gap: 6 },
  buffItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, overflow: 'hidden', minWidth: 50 },
  buffEmoji: { fontSize: 14, marginRight: 4 },
  buffProgress: { position: 'absolute', bottom: 0, left: 0, height: 2, borderRadius: 1 },
  killFeed: { position: 'absolute', bottom: 160, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  killText: { fontSize: 12, color: '#FFD700', fontWeight: '600', paddingVertical: 2 },
});
