import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { CELL_SIZE, GRID_SIZE, THEME_COLORS, Theme, FoodType } from '../utils/constants';
import { Position } from '../store/gameSlice';

interface GameRendererProps {
  snakeBody: Position[];
  foodPosition: Position;
  foodType: FoodType;
  specialFood: { position: Position; type: FoodType } | null;
  theme: Theme;
}

const SnakeHead: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <View
    style={[
      styles.cell,
      {
        left: x * CELL_SIZE,
        top: y * CELL_SIZE,
        backgroundColor: color,
        borderRadius: CELL_SIZE / 2,
      },
    ]}
  >
    <View style={[styles.eye, { left: CELL_SIZE * 0.2, top: CELL_SIZE * 0.2 }]} />
    <View style={[styles.eye, { left: CELL_SIZE * 0.6, top: CELL_SIZE * 0.2 }]} />
  </View>
);

const SnakeSegment: React.FC<{ x: number; y: number; color: string; alpha: number }> = ({
  x, y, color, alpha,
}) => (
  <View
    style={[
      styles.cell,
      {
        left: x * CELL_SIZE,
        top: y * CELL_SIZE,
        backgroundColor: color,
        opacity: alpha,
        borderRadius: 3,
      },
    ]}
  />
);

const FoodItem: React.FC<{ x: number; y: number; type: FoodType; theme: Theme }> = ({
  x, y, type, theme,
}) => {
  const colors = THEME_COLORS[theme];
  let bgColor = colors.food;
  let shape: 'circle' | 'star' | 'diamond' = 'circle';

  switch (type) {
    case FoodType.STAR:
      bgColor = colors.special;
      shape = 'star';
      break;
    case FoodType.ROCKET:
      bgColor = '#FF5722';
      shape = 'diamond';
      break;
    case FoodType.SHIELD:
      bgColor = '#2196F3';
      shape = 'diamond';
      break;
    case FoodType.MAGNET:
      bgColor = '#E91E63';
      shape = 'circle';
      break;
  }

  return (
    <View
      style={[
        styles.food,
        {
          left: x * CELL_SIZE,
          top: y * CELL_SIZE,
          backgroundColor: bgColor,
          borderRadius: shape === 'circle' ? CELL_SIZE / 2 : shape === 'star' ? 2 : 4,
          transform: shape === 'diamond' ? [{ rotate: '45deg' }] : [],
        },
      ]}
    />
  );
};

export const GameRenderer: React.FC<GameRendererProps> = ({
  snakeBody,
  foodPosition,
  foodType,
  specialFood,
  theme,
}) => {
  const colors = THEME_COLORS[theme];

  const snakeSegments = useMemo(() => {
    return snakeBody.map((segment, index) => {
      if (index === 0) {
        return (
          <SnakeHead
            key="head"
            x={segment.x}
            y={segment.y}
            color={colors.snake}
          />
        );
      }
      return (
        <SnakeSegment
          key={index}
          x={segment.x}
          y={segment.y}
          color={colors.snake}
          alpha={1 - (index / snakeBody.length) * 0.5}
        />
      );
    });
  }, [snakeBody, colors.snake]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {snakeSegments}
      <FoodItem x={foodPosition.x} y={foodPosition.y} type={foodType} theme={theme} />
      {specialFood && (
        <FoodItem
          x={specialFood.position.x}
          y={specialFood.position.y}
          type={specialFood.type}
          theme={theme}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: GRID_SIZE * CELL_SIZE,
    height: GRID_SIZE * CELL_SIZE,
    position: 'relative',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE - 1,
    height: CELL_SIZE - 1,
  },
  eye: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  food: {
    position: 'absolute',
    width: CELL_SIZE - 2,
    height: CELL_SIZE - 2,
  },
});
