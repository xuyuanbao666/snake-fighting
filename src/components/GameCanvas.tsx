import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, PanResponder, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  growSnake,
  setFood,
  addScore,
  incrementFoodEaten,
  setPlaying,
  setPaused,
  updateSnakeBody,
  DIFFICULTY_CONFIG,
} from '../store/gameSlice';
import { Snake } from '../engine/Snake';
import { AISnake, createAISnakes } from '../engine/AISnake';
import { Food } from '../engine/Food';
import { Collision } from '../engine/Collision';
import { GameLoop } from '../engine/GameLoop';
import { TrapManager, PoisonFog, ActiveBuff, BuffType, BUFF_CONFIG, getRandomBuff } from '../engine/Hazard';
import { FoodType, THEME_COLORS, GRID_SIZE } from '../utils/constants';
import { soundManager } from '../utils/sound';
import { Storage } from '../utils/storage';
import { GameRenderer } from './GameRenderer';
import { RealtimeRanking } from './RealtimeRanking';

const { width: screenWidth } = Dimensions.get('window');
const JOYSTICK_SIZE = 120;
const JOYSTICK_KNOB_SIZE = 48;

export const GameCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const snakeRef = useRef<Snake>(new Snake());
  const aiSnakesRef = useRef<AISnake[]>([]);
  const foodRef = useRef<Food>(new Food());
  const gameLoopRef = useRef<GameLoop | null>(null);
  const trapManagerRef = useRef<TrapManager>(new TrapManager());
  const poisonFogRef = useRef<PoisonFog | null>(null);

  const { snake, food, isPlaying, isPaused, theme, difficulty } = useSelector(
    (state: RootState) => state.game,
  );

  const foodStateRef = useRef(food);
  const isShieldedRef = useRef(snake.isShielded);
  const [aiSnakesData, setAiSnakesData] = useState<{ body: { x: number; y: number }[]; color: string; name: string }[]>([]);
  const [rankingData, setRankingData] = useState<{ name: string; length: number; color: string; isPlayer: boolean }[]>([]);
  const [trapsData, setTrapsData] = useState<{ x: number; y: number; type: string; radius: number }[]>([]);
  const [fogData, setFogData] = useState<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);
  const [activeBuffs, setActiveBuffs] = useState<ActiveBuff[]>([]);
  const [killFeed, setKillFeed] = useState<{ text: string; time: number }[]>([]);
  const activeBuffsRef = useRef<ActiveBuff[]>([]);
  const baseSpeedRef = useRef(0.15);

  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickActive, setJoystickActive] = useState(false);

  useEffect(() => {
    foodStateRef.current = food;
  }, [food]);

  useEffect(() => {
    isShieldedRef.current = snake.isShielded;
  }, [snake.isShielded]);

  const generateNewFood = useCallback(() => {
    const allBodies = [
      ...snakeRef.current.body.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
      ...aiSnakesRef.current.filter(s => s.alive).flatMap(s => s.body.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }))),
    ];
    const newFoodPos = foodRef.current.generate(allBodies);
    const newFoodType = foodRef.current.getRandomType(snakeRef.current.body.length * 10);
    dispatch(setFood({ position: newFoodPos, type: newFoodType }));
  }, [dispatch]);

  const generateNewFoodRef = useRef(generateNewFood);
  useEffect(() => {
    generateNewFoodRef.current = generateNewFood;
  }, [generateNewFood]);

  const updateRanking = useCallback(() => {
    const entries = [
      { name: '你', length: snakeRef.current.body.length, color: THEME_COLORS[theme].snake, isPlayer: true },
      ...aiSnakesRef.current
        .filter(s => s.alive)
        .map(s => ({ name: s.name, length: s.getLength(), color: s.color, isPlayer: false })),
    ];
    setRankingData(entries);
  }, [theme]);

  const handleGameUpdate = useCallback(() => {
    const foodState = foodStateRef.current;
    const currentFood = foodState.current;
    const foods = [currentFood.position];
    if (foodState.special) foods.push(foodState.special.position);
    const isImpossible = difficulty === 'impossible';

    // Update hazards (impossible mode only)
    if (isImpossible && poisonFogRef.current) {
      poisonFogRef.current.update();
      trapManagerRef.current.update(
        snakeRef.current.body,
        aiSnakesRef.current.filter(s => s.alive).map(s => s.body)
      );

      // Check if player is in poison fog
      const head = snakeRef.current.getHead();
      if (!poisonFogRef.current.isInSafeZone(head)) {
        gameLoopRef.current?.stop();
        const score = Math.max(0, snakeRef.current.body.length - 5);
        Storage.addToLeaderboard({
          score,
          length: snakeRef.current.body.length,
          date: new Date().toISOString(),
          theme,
        });
        dispatch(setPlaying(false));
        soundManager.play('gameOver');
        return;
      }

      // Check trap collision
      const hitTrap = trapManagerRef.current.checkCollision(head);
      if (hitTrap) {
        if (hitTrap.type === 'spike') {
          gameLoopRef.current?.stop();
          const score = Math.max(0, snakeRef.current.body.length - 5);
          Storage.addToLeaderboard({
            score,
            length: snakeRef.current.body.length,
            date: new Date().toISOString(),
            theme,
          });
          dispatch(setPlaying(false));
          soundManager.play('gameOver');
          return;
        } else if (hitTrap.type === 'slow') {
          baseSpeedRef.current = Math.min(0.25, baseSpeedRef.current + 0.02);
        } else if (hitTrap.type === 'poison') {
          // Poison shrinks the snake by 2 segments
          if (snakeRef.current.body.length > 5) {
            snakeRef.current.body.pop();
            snakeRef.current.body.pop();
          }
        }
      }

      // Update hazard render data
      setTrapsData(
        trapManagerRef.current.traps
          .filter(t => t.active)
          .map(t => ({ x: t.position.x, y: t.position.y, type: t.type, radius: t.radius }))
      );
      setFogData({
        minX: poisonFogRef.current.minX,
        minY: poisonFogRef.current.minY,
        maxX: poisonFogRef.current.maxX,
        maxY: poisonFogRef.current.maxY,
      });
    }

    // Update AI snakes
    for (const ai of aiSnakesRef.current) {
      if (!ai.alive) continue;

      // AI avoids traps in impossible mode
      if (isImpossible) {
        const aiHead = ai.getHead();
        const nearTrap = trapManagerRef.current.traps.find(t =>
          t.active && Math.abs(t.position.x - aiHead.x) < 3 && Math.abs(t.position.y - aiHead.y) < 3
        );
        if (nearTrap) {
          // Steer away from trap
          const dx = aiHead.x - nearTrap.position.x;
          const dy = aiHead.y - nearTrap.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          ai.velocityX = dx / dist;
          ai.velocityY = dy / dist;
          // Don't call ai.move() here - update() will handle it
        }
      }

      ai.update(foods, snakeRef.current.getHead(), snakeRef.current.body);

      // Check if AI snake hits player's body → AI dies
      const aiHeadPos = ai.getHead();
      for (let pi = 1; pi < snakeRef.current.body.length; pi++) {
        const seg = snakeRef.current.body[pi];
        const dx = aiHeadPos.x - seg.x;
        const dy = aiHeadPos.y - seg.y;
        if (dx * dx + dy * dy < 0.8) {
          ai.alive = false;
          const buffType = getRandomBuff();
          activeBuffsRef.current.push({ type: buffType, duration: BUFF_CONFIG[buffType].duration, startTime: Date.now() });
          setActiveBuffs([...activeBuffsRef.current]);
          setKillFeed(prev => [...prev.slice(-4), { text: `击杀 ${ai.name}! ${BUFF_CONFIG[buffType].emoji} ${BUFF_CONFIG[buffType].label}`, time: Date.now() }]);
          break;
        }
      }

      const aiHead = { x: Math.round(ai.getHead().x), y: Math.round(ai.getHead().y) };
      for (const foodPos of foods) {
        if (Collision.checkFoodCollision(aiHead, foodPos)) {
          ai.grow();
          if (foodPos.x === currentFood.position.x && foodPos.y === currentFood.position.y) {
            generateNewFoodRef.current();
          }
        }
      }

      // Check if AI just died from wall collision → give player buff
      if (ai.justDied) {
        const buffType = getRandomBuff();
        activeBuffsRef.current.push({ type: buffType, duration: BUFF_CONFIG[buffType].duration, startTime: Date.now() });
        setActiveBuffs([...activeBuffsRef.current]);
        setKillFeed(prev => [...prev.slice(-4), { text: `${ai.name} 撞墙! ${BUFF_CONFIG[buffType].emoji} ${BUFF_CONFIG[buffType].label}`, time: Date.now() }]);
      }
    }

    // Update active buffs
    activeBuffsRef.current = activeBuffsRef.current
      .map(b => ({ ...b, duration: b.duration - 1 }))
      .filter(b => b.duration > 0);
    setActiveBuffs([...activeBuffsRef.current]);

    // Apply buff effects
    const hasShield = activeBuffsRef.current.some(b => b.type === 'shield');
    const hasSpeed = activeBuffsRef.current.some(b => b.type === 'speed');
    const hasDoubleScore = activeBuffsRef.current.some(b => b.type === 'doubleScore');
    // Shield combines: Redux state OR buff
    isShieldedRef.current = snake.isShielded || hasShield;

    // Speed buff: increase speed, restore when expired
    if (hasSpeed) {
      snakeRef.current.speed = baseSpeedRef.current * 1.5;
    } else {
      snakeRef.current.speed = baseSpeedRef.current;
    }

    // Update player
    snakeRef.current.move();

    if (snakeRef.current.checkWallCollision()) {
      if (!isShieldedRef.current) {
        gameLoopRef.current?.stop();
        const score = Math.max(0, snakeRef.current.body.length - 5);
        const length = snakeRef.current.body.length;
        Storage.addToLeaderboard({
          score,
          length,
          date: new Date().toISOString(),
          theme,
        });
        dispatch(setPlaying(false));
        soundManager.play('gameOver');
        return;
      }
    }

    const bodyCopy = snakeRef.current.body.map(p => ({ x: p.x, y: p.y }));
    dispatch(updateSnakeBody(bodyCopy));

    const head = snakeRef.current.getHead();
    const headGrid = { x: Math.round(head.x), y: Math.round(head.y) };
    if (Collision.checkFoodCollision(headGrid, currentFood.position)) {
      snakeRef.current.grow();
      dispatch(growSnake());
      const baseScore = currentFood.type === FoodType.STAR ? 50 : 10;
      const finalScore = hasDoubleScore ? baseScore * 2 : baseScore;
      dispatch(addScore(finalScore));
      dispatch(incrementFoodEaten());
      soundManager.play(currentFood.type === FoodType.NORMAL ? 'eat' : 'special');
      generateNewFoodRef.current();
    }

    // Update AI rendering data
    setAiSnakesData(
      aiSnakesRef.current
        .filter(s => s.alive)
        .map(s => ({ body: s.body.map(p => ({ ...p })), color: s.color, name: s.name }))
    );

    updateRanking();
  }, [dispatch, theme, updateRanking, difficulty]);

  const handleGameUpdateRef = useRef(handleGameUpdate);
  useEffect(() => {
    handleGameUpdateRef.current = handleGameUpdate;
  }, [handleGameUpdate]);

  const prevIsPlaying = useRef(false);
  const prevIsPaused = useRef(false);

  useEffect(() => {
    const wasPlaying = prevIsPlaying.current;
    const wasPaused = prevIsPaused.current;
    prevIsPlaying.current = isPlaying;
    prevIsPaused.current = isPaused;

    if (!isPlaying) {
      gameLoopRef.current?.stop();
      return;
    }

    if (isPaused) {
      gameLoopRef.current?.stop();
      return;
    }

    const isNewGame = !wasPlaying;

    if (isNewGame) {
      const diffConfig = DIFFICULTY_CONFIG[difficulty];
      snakeRef.current = new Snake();
      snakeRef.current.speed = diffConfig.playerSpeed;
      baseSpeedRef.current = diffConfig.playerSpeed;
      aiSnakesRef.current = createAISnakes(diffConfig.aiCount, {
        speed: diffConfig.aiSpeed,
        intelligence: diffConfig.aiIntelligence,
      });

      // Initialize hazards for impossible mode
      if (difficulty === 'impossible') {
        trapManagerRef.current = new TrapManager();
        poisonFogRef.current = new PoisonFog();
      } else {
        poisonFogRef.current = null;
        setTrapsData([]);
        setFogData(null);
      }

      // Reset buffs
      activeBuffsRef.current = [];
      setActiveBuffs([]);
      setKillFeed([]);

      const bodyCopy = snakeRef.current.body.map(p => ({ x: p.x, y: p.y }));
      dispatch(updateSnakeBody(bodyCopy));
      generateNewFoodRef.current();
    }

    gameLoopRef.current?.stop();
    gameLoopRef.current = new GameLoop(
      () => handleGameUpdateRef.current(),
      16,
    );
    gameLoopRef.current.start();

    return () => {
      gameLoopRef.current?.stop();
    };
  }, [isPlaying, isPaused, dispatch, difficulty]);

  const joystickPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setJoystickActive(true);
        setJoystickPos({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = JOYSTICK_SIZE / 2 - JOYSTICK_KNOB_SIZE / 2;
        const clampedDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);
        setJoystickPos({
          x: Math.cos(angle) * clampedDist,
          y: Math.sin(angle) * clampedDist,
        });
        if (dist > 10) {
          snakeRef.current.setDirectionFromAngle(angle);
        }
      },
      onPanResponderRelease: () => {
        setJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
      },
    }),
  ).current;

  const handlePauseToggle = useCallback(() => {
    dispatch(setPaused(!isPaused));
  }, [dispatch, isPaused]);

  const handleBackToLobby = useCallback(() => {
    gameLoopRef.current?.stop();
    dispatch(setPlaying(false));
    dispatch(setPaused(false));
  }, [dispatch]);

  const colors = THEME_COLORS[theme];
  const score = Math.max(0, snake.body.length - 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.snake }]} onPress={handleBackToLobby}>
          <Text style={styles.iconBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={[styles.scoreBox, { backgroundColor: 'rgba(255,255,255,0.85)' }]}>
          <Text style={[styles.scoreNum, { color: colors.snake }]}>{score}</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.snake }]} onPress={handlePauseToggle}>
          <Text style={styles.iconBtnText}>{isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.gameArea}>
        <GameRenderer
          snakeBody={snake.body}
          foodPosition={food.current.position}
          foodType={food.current.type}
          specialFood={food.special}
          theme={theme}
          aiSnakes={aiSnakesData}
          traps={trapsData}
          fog={fogData}
        />
        <RealtimeRanking entries={rankingData} />

        {/* Active Buffs */}
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

        {/* Kill Feed */}
        {killFeed.length > 0 && (
          <View style={styles.killFeed}>
            {killFeed.slice(-3).map((kill, i) => (
              <Text key={kill.time} style={styles.killText}>{kill.text}</Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.joystickArea} {...joystickPanResponder.panHandlers}>
        <View style={[styles.joystickBase, { opacity: joystickActive ? 0.8 : 0.4 }]}>
          <View
            style={[
              styles.joystickKnob,
              {
                transform: [{ translateX: joystickPos.x }, { translateY: joystickPos.y }],
                backgroundColor: colors.snake,
              },
            ]}
          />
        </View>
      </View>

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={[styles.pauseCard, { backgroundColor: '#FFF' }]}>
            <Text style={styles.pauseEmoji}>⏸</Text>
            <Text style={styles.pauseTitle}>暂停</Text>
            <TouchableOpacity style={[styles.pauseBtn, { backgroundColor: colors.snake }]} onPress={handlePauseToggle}>
              <Text style={styles.pauseBtnText}>继续游戏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.lobbyBtn} onPress={handleBackToLobby}>
              <Text style={[styles.lobbyBtnText, { color: '#999' }]}>返回大厅</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3,
  },
  iconBtnText: { fontSize: 18, color: '#FFF', fontWeight: '700' },
  scoreBox: {
    paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  scoreNum: { fontSize: 28, fontWeight: '800' },
  gameArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  joystickArea: {
    position: 'absolute', bottom: 40, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center', height: JOYSTICK_SIZE + 20,
  },
  joystickBase: {
    width: JOYSTICK_SIZE, height: JOYSTICK_SIZE, borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  joystickKnob: {
    width: JOYSTICK_KNOB_SIZE, height: JOYSTICK_KNOB_SIZE, borderRadius: JOYSTICK_KNOB_SIZE / 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4,
  },
  pauseOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  pauseCard: {
    borderRadius: 24, paddingVertical: 36, paddingHorizontal: 28, alignItems: 'center',
    width: screenWidth * 0.75, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
  },
  pauseEmoji: { fontSize: 48, marginBottom: 12 },
  pauseTitle: { fontSize: 26, fontWeight: '700', color: '#333', marginBottom: 28 },
  pauseBtn: {
    width: '100%', height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  pauseBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  lobbyBtn: { paddingVertical: 10 },
  lobbyBtnText: { fontSize: 15, fontWeight: '500' },
  buffBar: {
    position: 'absolute',
    top: 110,
    right: 8,
    flexDirection: 'column',
    gap: 6,
  },
  buffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 50,
  },
  buffEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  buffProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 2,
    borderRadius: 1,
  },
  killFeed: {
    position: 'absolute',
    bottom: 160,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  killText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    paddingVertical: 2,
  },
});
