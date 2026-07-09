import React, { useRef, useEffect, useCallback } from 'react';
import { View, PanResponder, Dimensions, StyleSheet } from 'react-native';
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
import { CELL_SIZE, GRID_SIZE, FoodType } from '../utils/constants';
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
  const snakeBodyRef = useRef(snake.body);

  useEffect(() => {
    directionRef.current = snake.direction;
  }, [snake.direction]);

  useEffect(() => {
    foodStateRef.current = food;
  }, [food]);

  useEffect(() => {
    isShieldedRef.current = snake.isShielded;
  }, [snake.isShielded]);

  const generateNewFood = useCallback(() => {
    const newFoodPos = foodRef.current.generate(snakeRef.current.body);
    const newFoodType = foodRef.current.getRandomType(snakeRef.current.body.length * 10);
    dispatch(setFood({ position: newFoodPos, type: newFoodType }));
  }, [dispatch]);

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

    snakeBodyRef.current = [...snakeRef.current.body];
    dispatch(updateSnakeBody(snakeRef.current.body));

    const head = snakeRef.current.getHead();
    const foodState = foodStateRef.current;
    const currentFood = foodState.current;
    if (Collision.checkFoodCollision(head, currentFood.position)) {
      dispatch(growSnake());
      snakeRef.current.grow();
      dispatch(addScore(currentFood.type === FoodType.STAR ? 50 : 10));
      dispatch(incrementFoodEaten());
      soundManager.play(currentFood.type === FoodType.NORMAL ? 'eat' : 'special');
      generateNewFood();
    }
  }, [dispatch, generateNewFood]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      snakeRef.current = new Snake();
      snakeBodyRef.current = snakeRef.current.body;
      dispatch(updateSnakeBody(snakeRef.current.body));
      generateNewFood();
      gameLoopRef.current = new GameLoop(handleGameUpdate, snake.speed);
      gameLoopRef.current.start();
    }
    return () => {
      gameLoopRef.current?.stop();
    };
  }, [isPlaying, isPaused, snake.speed, handleGameUpdate, dispatch, generateNewFood]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (Math.abs(dx) > Math.abs(dy)) {
          dispatch(setDirection(dx > 0 ? 'RIGHT' : 'LEFT'));
        } else {
          dispatch(setDirection(dy > 0 ? 'DOWN' : 'UP'));
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
