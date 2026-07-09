import React, { useRef, useEffect, useCallback } from 'react';
import { View, PanResponder, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  setDirectionAngle,
  growSnake,
  setFood,
  addScore,
  incrementFoodEaten,
  setPlaying,
  setPaused,
  updateSnakeBody,
} from '../store/gameSlice';
import { Snake } from '../engine/Snake';
import { Food } from '../engine/Food';
import { Collision } from '../engine/Collision';
import { GameLoop } from '../engine/GameLoop';
import { FoodType, THEME_COLORS } from '../utils/constants';
import { soundManager } from '../utils/sound';
import { GameRenderer } from './GameRenderer';

const { width: screenWidth } = Dimensions.get('window');

export const GameCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const snakeRef = useRef<Snake>(new Snake());
  const foodRef = useRef<Food>(new Food());
  const gameLoopRef = useRef<GameLoop | null>(null);

  const { snake, food, isPlaying, isPaused, theme } = useSelector(
    (state: RootState) => state.game,
  );

  const directionAngleRef = useRef(snake.directionAngle);
  const foodStateRef = useRef(food);
  const isShieldedRef = useRef(snake.isShielded);
  const speedRef = useRef(snake.speed);

  useEffect(() => {
    directionAngleRef.current = snake.directionAngle;
  }, [snake.directionAngle]);

  useEffect(() => {
    foodStateRef.current = food;
  }, [food]);

  useEffect(() => {
    isShieldedRef.current = snake.isShielded;
  }, [snake.isShielded]);

  useEffect(() => {
    speedRef.current = snake.speed;
    if (gameLoopRef.current?.isRunning()) {
      gameLoopRef.current.setSpeed(snake.speed);
    }
  }, [snake.speed]);

  const generateNewFood = useCallback(() => {
    const newFoodPos = foodRef.current.generate(snakeRef.current.body);
    const newFoodType = foodRef.current.getRandomType(snakeRef.current.body.length * 10);
    dispatch(setFood({ position: newFoodPos, type: newFoodType }));
  }, [dispatch]);

  const generateNewFoodRef = useRef(generateNewFood);
  useEffect(() => {
    generateNewFoodRef.current = generateNewFood;
  }, [generateNewFood]);

  const handleGameUpdate = useCallback(() => {
    snakeRef.current.setDirectionFromAngle(directionAngleRef.current);
    snakeRef.current.move();

    if (
      snakeRef.current.checkWallCollision() ||
      snakeRef.current.checkSelfCollision()
    ) {
      if (!isShieldedRef.current) {
        gameLoopRef.current?.stop();
        dispatch(setPlaying(false));
        soundManager.play('gameOver');
        return;
      }
    }

    const bodyCopy = snakeRef.current.body.map(p => ({ ...p }));
    dispatch(updateSnakeBody(bodyCopy));

    const head = snakeRef.current.getHead();
    const foodState = foodStateRef.current;
    const currentFood = foodState.current;
    if (Collision.checkFoodCollision(head, currentFood.position)) {
      snakeRef.current.grow();
      dispatch(growSnake());
      dispatch(addScore(currentFood.type === FoodType.STAR ? 50 : 10));
      dispatch(incrementFoodEaten());
      soundManager.play(currentFood.type === FoodType.NORMAL ? 'eat' : 'special');
      generateNewFoodRef.current();
    }
  }, [dispatch]);

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
      snakeRef.current = new Snake();
      const bodyCopy = snakeRef.current.body.map(p => ({ ...p }));
      dispatch(updateSnakeBody(bodyCopy));
      generateNewFoodRef.current();
    }

    gameLoopRef.current?.stop();
    gameLoopRef.current = new GameLoop(
      () => handleGameUpdateRef.current(),
      speedRef.current,
    );
    gameLoopRef.current.start();

    return () => {
      gameLoopRef.current?.stop();
    };
  }, [isPlaying, isPaused, dispatch]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
        const angle = Math.atan2(dy, dx);
        dispatch(setDirectionAngle(angle));
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
  const score = snake.body.length - 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
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
        />
      </View>

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={[styles.pauseCard, { backgroundColor: '#FFF' }]}>
            <Text style={styles.pauseEmoji}>⏸</Text>
            <Text style={styles.pauseTitle}>暂停</Text>
            <TouchableOpacity
              style={[styles.pauseBtn, { backgroundColor: colors.snake }]}
              onPress={handlePauseToggle}
            >
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
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBtnText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
  },
  scoreBox: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreNum: {
    fontSize: 28,
    fontWeight: '800',
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCard: {
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: screenWidth * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  pauseEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  pauseTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 28,
  },
  pauseBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pauseBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  lobbyBtn: {
    paddingVertical: 10,
  },
  lobbyBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
