import React, { useRef, useEffect, useCallback } from 'react';
import { View, PanResponder, Dimensions, StyleSheet } from 'react-native';
import Canvas from 'react-native-canvas';
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
import { Renderer } from '../engine/Renderer';
import { Snake } from '../engine/Snake';
import { Food } from '../engine/Food';
import { Collision } from '../engine/Collision';
import { GameLoop } from '../engine/GameLoop';
import { CELL_SIZE, FoodType } from '../utils/constants';

const { width: screenWidth } = Dimensions.get('window');
const canvasSize = Math.floor(screenWidth / CELL_SIZE) * CELL_SIZE;

export const GameCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const canvasRef = useRef<Canvas | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const snakeRef = useRef<Snake>(new Snake());
  const foodRef = useRef<Food>(new Food());
  const gameLoopRef = useRef<GameLoop | null>(null);

  const { snake, food, isPlaying, isPaused, theme } = useSelector(
    (state: RootState) => state.game,
  );

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new Renderer(canvasRef.current, theme);
    }
  }, [theme]);

  const generateNewFood = useCallback(() => {
    const newFoodPos = foodRef.current.generate(snakeRef.current.body);
    const newFoodType = foodRef.current.getRandomType(snake.body.length * 10);
    dispatch(setFood({ position: newFoodPos, type: newFoodType }));
  }, [dispatch, snake.body.length]);

  const handleGameUpdate = useCallback(() => {
    if (!rendererRef.current) return;

    snakeRef.current.direction = snake.direction;
    snakeRef.current.move();

    if (
      snakeRef.current.checkWallCollision() ||
      snakeRef.current.checkSelfCollision()
    ) {
      if (!snake.isShielded) {
        gameLoopRef.current?.stop();
        dispatch(setPlaying(false));
        return;
      }
    }

    dispatch(updateSnakeBody(snakeRef.current.body));

    const head = snakeRef.current.getHead();
    if (Collision.checkFoodCollision(head, food.current.position)) {
      dispatch(growSnake());
      snakeRef.current.grow();
      dispatch(addScore(food.current.type === FoodType.STAR ? 50 : 10));
      dispatch(incrementFoodEaten());
      generateNewFood();
    }

    rendererRef.current.clear();
    rendererRef.current.drawSnakeHead(head.x, head.y, theme);
    rendererRef.current.drawSnakeBody(
      snakeRef.current.body.slice(1),
      theme,
    );
    rendererRef.current.drawFood(
      food.current.position.x,
      food.current.position.y,
      food.current.type,
    );

    if (food.special) {
      rendererRef.current.drawFood(
        food.special.position.x,
        food.special.position.y,
        food.special.type,
      );
    }
  }, [
    dispatch,
    food,
    generateNewFood,
    snake.direction,
    snake.isShielded,
    theme,
  ]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      gameLoopRef.current = new GameLoop(handleGameUpdate, snake.speed);
      gameLoopRef.current.start();
    }
    return () => {
      gameLoopRef.current?.stop();
    };
  }, [isPlaying, isPaused, snake.speed, handleGameUpdate]);

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

  const handleCanvasInit = useCallback(
    (canvas: Canvas) => {
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      canvasRef.current = canvas;
      rendererRef.current = new Renderer(canvas, theme);
    },
    [theme],
  );

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Canvas
        ref={handleCanvasInit}
        style={{ width: canvasSize, height: canvasSize }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
