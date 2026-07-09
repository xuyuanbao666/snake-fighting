import React, { useRef, useEffect, useCallback } from 'react';
import { View, PanResponder, StyleSheet, TouchableOpacity, Text } from 'react-native';
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
import { FoodType } from '../utils/constants';
import { soundManager } from '../utils/sound';
import { GameRenderer } from './GameRenderer';

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

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={handleBackToLobby}>
          <Text style={styles.iconText}>←</Text>
        </TouchableOpacity>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>分数</Text>
          <Text style={styles.scoreValue}>{snake.body.length - 3}</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={handlePauseToggle}>
          <Text style={styles.iconText}>{isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
      </View>

      <GameRenderer
        snakeBody={snake.body}
        foodPosition={food.current.position}
        foodType={food.current.type}
        specialFood={food.special}
        theme={theme}
      />

      {isPaused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>暂停</Text>
            <TouchableOpacity style={styles.resumeButton} onPress={handlePauseToggle}>
              <Text style={styles.resumeText}>继续游戏</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.lobbyButton} onPress={handleBackToLobby}>
              <Text style={styles.lobbyText}>返回大厅</Text>
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
    backgroundColor: '#E8F5E9',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 200,
  },
  pauseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  resumeText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lobbyButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  lobbyText: {
    color: '#666',
    fontSize: 16,
  },
});
