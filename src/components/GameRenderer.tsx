import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { CELL_SIZE, GRID_SIZE, VIEWPORT_CELLS, THEME_COLORS, Theme, FoodType } from '../utils/constants';
import { Position } from '../store/gameSlice';

const { width: screenWidth } = Dimensions.get('window');
const VIEWPORT_SIZE = Math.min(screenWidth - 32, VIEWPORT_CELLS * CELL_SIZE);
const CELL_PX = VIEWPORT_SIZE / VIEWPORT_CELLS;
const MINIMAP_SIZE = 80;
const MINIMAP_SCALE = MINIMAP_SIZE / GRID_SIZE;

interface GameRendererProps {
  snakeBody: Position[];
  foodPosition: Position;
  foodType: FoodType;
  specialFood: { position: Position; type: FoodType } | null;
  theme: Theme;
}

function getViewportOffset(headX: number, headY: number) {
  const halfView = VIEWPORT_CELLS / 2;
  let offsetX = headX - halfView;
  let offsetY = headY - halfView;
  offsetX = Math.max(0, Math.min(offsetX, GRID_SIZE - VIEWPORT_CELLS));
  offsetY = Math.max(0, Math.min(offsetY, GRID_SIZE - VIEWPORT_CELLS));
  return { offsetX, offsetY };
}

function isInViewport(x: number, y: number, offsetX: number, offsetY: number) {
  return x >= offsetX - 1 && x <= offsetX + VIEWPORT_CELLS + 1 &&
         y >= offsetY - 1 && y <= offsetY + VIEWPORT_CELLS + 1;
}

const SnakeHead: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => {
  const size = CELL_PX * 1.1;
  return (
    <View
      style={[
        styles.head,
        {
          left: x * CELL_PX - size / 2,
          top: y * CELL_PX - size / 2,
          width: size,
          height: size,
          backgroundColor: color,
        },
      ]}
    >
      <View style={[styles.eye, { top: size * 0.2, left: size * 0.15 }]} />
      <View style={[styles.eye, { top: size * 0.2, left: size * 0.55 }]} />
      <View style={[styles.eyePupil, { top: size * 0.24, left: size * 0.19 }]} />
      <View style={[styles.eyePupil, { top: size * 0.24, left: size * 0.59 }]} />
    </View>
  );
};

const SnakeSegment: React.FC<{ x: number; y: number; color: string; alpha: number; radius: number }> = ({
  x, y, color, alpha, radius,
}) => (
  <View
    style={[
      styles.segment,
      {
        left: x * CELL_PX - radius,
        top: y * CELL_PX - radius,
        width: radius * 2,
        height: radius * 2,
        backgroundColor: color,
        opacity: alpha,
        borderRadius: radius,
      },
    ]}
  />
);

const FoodItem: React.FC<{ x: number; y: number; type: FoodType; theme: Theme }> = ({ x, y, type, theme }) => {
  const colors = THEME_COLORS[theme];
  let bgColor: string;
  const size = CELL_PX * 0.7;

  switch (type) {
    case FoodType.STAR: bgColor = '#FFD700'; break;
    case FoodType.ROCKET: bgColor = '#FF5722'; break;
    case FoodType.SHIELD: bgColor = '#2196F3'; break;
    case FoodType.MAGNET: bgColor = '#E91E63'; break;
    default: bgColor = colors.food; break;
  }

  return (
    <View
      style={[
        styles.food,
        {
          left: x * CELL_PX - size / 2,
          top: y * CELL_PX - size / 2,
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderRadius: type === FoodType.STAR ? 4 : size / 2,
        },
      ]}
    >
      {type === FoodType.NORMAL && <View style={styles.foodLeaf} />}
      {type === FoodType.STAR && <View style={styles.foodGlow} />}
    </View>
  );
};

const Minimap: React.FC<{
  snakeBody: Position[];
  foodPosition: Position;
  specialFood: { position: Position; type: FoodType } | null;
  offsetX: number;
  offsetY: number;
  colors: typeof THEME_COLORS.classic;
}> = ({ snakeBody, foodPosition, specialFood, offsetX, offsetY, colors }) => {
  const head = snakeBody[0];
  return (
    <View style={[styles.minimap, { backgroundColor: colors.background + 'CC' }]}>
      <View
        style={[
          styles.minimapViewport,
          {
            left: offsetX * MINIMAP_SCALE,
            top: offsetY * MINIMAP_SCALE,
            width: VIEWPORT_CELLS * MINIMAP_SCALE,
            height: VIEWPORT_CELLS * MINIMAP_SCALE,
          },
        ]}
      />
      <View
        style={[
          styles.minimapFood,
          {
            left: foodPosition.x * MINIMAP_SCALE - 1.5,
            top: foodPosition.y * MINIMAP_SCALE - 1.5,
          },
        ]}
      />
      {specialFood && (
        <View
          style={[
            styles.minimapFood,
            {
              left: specialFood.position.x * MINIMAP_SCALE - 1.5,
              top: specialFood.position.y * MINIMAP_SCALE - 1.5,
              backgroundColor: '#FFD700',
            },
          ]}
        />
      )}
      {snakeBody.map((seg, i) => (
        <View
          key={i}
          style={[
            styles.minimapSnake,
            {
              left: seg.x * MINIMAP_SCALE - 1,
              top: seg.y * MINIMAP_SCALE - 1,
              backgroundColor: i === 0 ? colors.snake : colors.snake + 'AA',
            },
          ]}
        />
      ))}
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
  const head = snakeBody[0];
  const { offsetX, offsetY } = getViewportOffset(head.x, head.y);

  const snakeSegments = useMemo(() => {
    const segRadius = CELL_PX * 0.4;
    return snakeBody.map((segment, index) => {
      if (!isInViewport(segment.x, segment.y, offsetX, offsetY)) return null;

      const viewX = segment.x - offsetX;
      const viewY = segment.y - offsetY;

      if (index === 0) {
        return (
          <SnakeHead
            key="head"
            x={viewX}
            y={viewY}
            color={colors.snake}
          />
        );
      }
      const alpha = Math.max(0.35, 1 - (index / snakeBody.length) * 0.65);
      const r = segRadius * (1 - index / snakeBody.length * 0.3);
      return (
        <SnakeSegment
          key={index}
          x={viewX}
          y={viewY}
          color={colors.snake}
          alpha={alpha}
          radius={r}
        />
      );
    });
  }, [snakeBody, offsetX, offsetY, colors.snake]);

  const foodVisible = isInViewport(foodPosition.x, foodPosition.y, offsetX, offsetY);
  const specialVisible = specialFood && isInViewport(specialFood.position.x, specialFood.position.y, offsetX, offsetY);

  return (
    <View>
      <View style={[styles.board, { backgroundColor: colors.background, width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }]}>
        <View style={[styles.gridOverlay, { borderColor: colors.snake + '15' }]}>
          {Array.from({ length: VIEWPORT_CELLS - 1 }).map((_, i) => (
            <View key={`h${i}`} style={[styles.gridLineH, { top: (i + 1) * CELL_PX }]} />
          ))}
          {Array.from({ length: VIEWPORT_CELLS - 1 }).map((_, i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * CELL_PX }]} />
          ))}
        </View>
        {snakeSegments}
        {foodVisible && (
          <FoodItem
            x={foodPosition.x - offsetX}
            y={foodPosition.y - offsetY}
            type={foodType}
            theme={theme}
          />
        )}
        {specialVisible && (
          <FoodItem
            x={specialFood.position.x - offsetX}
            y={specialFood.position.y - offsetY}
            type={specialFood.type}
            theme={theme}
          />
        )}
      </View>
      <Minimap
        snakeBody={snakeBody}
        foodPosition={foodPosition}
        specialFood={specialFood}
        offsetX={offsetX}
        offsetY={offsetY}
        colors={colors}
      />
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
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  head: {
    position: 'absolute',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
  minimap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  minimapViewport: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
  },
  minimapSnake: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
  },
  minimapFood: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#F44336',
  },
});
