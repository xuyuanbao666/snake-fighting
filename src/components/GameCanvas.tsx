import React, { useRef, useEffect, useCallback } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import {
  setDirection,
  growSnake,
  setFood,
  addScore,
  incrementFoodEaten,
  setPlaying,
  updateSnakeBody,
} from '../store/gameSlice';
import { Snake } from '../engine/Snake';
import { Food } from '../engine/Food';
import { Collision } from '../engine/Collision';
import { GameLoop } from '../engine/GameLoop';
import { Direction, FoodType } from '../utils/constants';
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

  const directionRef = useRef(snake.direction);
  const foodStateRef = useRef(food);
  const isShieldedRef = useRef(snake.isShielded);
  const speedRef = useRef(snake.speed);

  useEffect(() => {
    directionRef.current = snake.direction;
  }, [snake.direction]);

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
    snakeRef.current.direction = directionRef.current;
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
    const isResumeFromPause = wasPlaying && wasPaused;

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
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) > Math.abs(dy)) {
          dispatch(setDirection(dx > 0 ? Direction.RIGHT : Direction.LEFT));
        } else {
          dispatch(setDirection(dy > 0 ? Direction.DOWN : Direction.UP));
        }
      },
    }),
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <GameRenderer
        snakeBody={snake.body}
        foodPosition={food.current.position}
        foodType={food.current.type}
        specialFood={food.special}
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});
