import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { CELL_SIZE, GRID_SIZE, THEME_COLORS, Theme, FoodType } from '../utils/constants';
import { Position } from '../store/gameSlice';

const { width: screenWidth } = Dimensions.get('window');
const GAME_BOARD_SIZE = Math.min(screenWidth - 32, GRID_SIZE * CELL_SIZE);
const SCALE = GAME_BOARD_SIZE / (GRID_SIZE * CELL_SIZE);

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
      styles.head,
      {
        left: x * CELL_SIZE * SCALE,
        top: y * CELL_SIZE * SCALE,
        width: CELL_SIZE * SCALE,
        height: CELL_SIZE * SCALE,
        backgroundColor: color,
      },
    ]}
  >
    <View style={[styles.eye, { top: CELL_SIZE * SCALE * 0.18, left: CELL_SIZE * SCALE * 0.18 }]} />
    <View style={[styles.eye, { top: CELL_SIZE * SCALE * 0.18, left: CELL_SIZE * SCALE * 0.58 }]} />
    <View style={[styles.eyePupil, { top: CELL_SIZE * SCALE * 0.22, left: CELL_SIZE * SCALE * 0.22 }]} />
    <View style={[styles.eyePupil, { top: CELL_SIZE * SCALE * 0.22, left: CELL_SIZE * SCALE * 0.62 }]} />
  </View>
);

const SnakeSegment: React.FC<{ x: number; y: number; color: string; alpha: number; isLast: boolean }> = ({
  x, y, color, alpha, isLast,
}) => (
  <View
    style={[
      styles.segment,
      {
        left: x * CELL_SIZE * SCALE + 1,
        top: y * CELL_SIZE * SCALE + 1,
        width: CELL_SIZE * SCALE - 2,
        height: CELL_SIZE * SCALE - 2,
        backgroundColor: color,
        opacity: alpha,
        borderRadius: isLast ? (CELL_SIZE * SCALE) / 2 : 4,
      },
    ]}
  />
);

const FoodItem: React.FC<{ x: number; y: number; type: FoodType; theme: Theme }> = ({ x, y, type, theme }) => {
  const colors = THEME_COLORS[theme];
  let bgColor: string;
  let size = CELL_SIZE * SCALE * 0.7;
  let borderRadius = size / 2;

  switch (type) {
    case FoodType.STAR:
      bgColor = '#FFD700';
      break;
    case FoodType.ROCKET:
      bgColor = '#FF5722';
      borderRadius = 4;
      break;
    case FoodType.SHIELD:
      bgColor = '#2196F3';
      borderRadius = 6;
      break;
    case FoodType.MAGNET:
      bgColor = '#E91E63';
      break;
    default:
      bgColor = colors.food;
      break;
  }

  return (
    <View
      style={[
        styles.food,
        {
          left: x * CELL_SIZE * SCALE + (CELL_SIZE * SCALE - size) / 2,
          top: y * CELL_SIZE * SCALE + (CELL_SIZE * SCALE - size) / 2,
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderRadius,
        },
      ]}
    >
      {type === FoodType.NORMAL && <View style={styles.foodLeaf} />}
      {type === FoodType.STAR && <View style={styles.foodGlow} />}
    </View>
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
      const alpha = Math.max(0.4, 1 - (index / snakeBody.length) * 0.6);
      return (
        <SnakeSegment
          key={index}
          x={segment.x}
          y={segment.y}
          color={colors.snake}
          alpha={alpha}
          isLast={index === snakeBody.length - 1}
        />
      );
    });
  }, [snakeBody, colors.snake]);

  return (
    <View style={[styles.board, { backgroundColor: colors.background, width: GAME_BOARD_SIZE, height: GAME_BOARD_SIZE }]}>
      <View style={[styles.gridOverlay, { borderColor: colors.snake + '20' }]}>
        {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: (i + 1) * CELL_SIZE * SCALE }]} />
        ))}
        {Array.from({ length: GRID_SIZE - 1 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * CELL_SIZE * SCALE }]} />
        ))}
      </View>
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
  board: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderRadius: 16,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  head: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  eye: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  eyePupil: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#333',
  },
  segment: {
    position: 'absolute',
  },
  food: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  foodLeaf: {
    position: 'absolute',
    top: -4,
    right: -2,
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    transform: [{ rotate: '30deg' }],
  },
  foodGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
});
