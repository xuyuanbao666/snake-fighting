import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { CELL_SIZE, GRID_SIZE, VIEWPORT_CELLS, THEME_COLORS, Theme, FoodType, FOOD_CONFIG } from '../utils/constants';
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
  aiSnakes?: { body: Position[]; color: string; name: string }[];
  traps?: { x: number; y: number; type: string; radius: number }[];
  fog?: { minX: number; minY: number; maxX: number; maxY: number } | null;
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
  const config = FOOD_CONFIG[type];
  let size = CELL_PX * 0.7;
  let borderRadius = size / 2;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Different sizes for different tiers
  if (type === 'STAR') {
    size = CELL_PX * 0.6;
  } else if (type === 'APPLE') {
    size = CELL_PX * 0.75;
  } else if (type === 'DIAMOND') {
    size = CELL_PX * 0.85;
    borderRadius = CELL_PX * 0.15;
  }

  // Star glow animation
  useEffect(() => {
    if (type === 'STAR') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [type]);

  // Diamond rotation animation
  useEffect(() => {
    if (type === 'DIAMOND') {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 2000, useNativeDriver: false })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [type]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle: any = {};
  if (type === 'STAR') {
    animatedStyle.shadowOpacity = glowOpacity;
    animatedStyle.shadowRadius = 8;
    animatedStyle.shadowColor = '#FFD700';
    animatedStyle.shadowOffset = { width: 0, height: 0 };
  } else if (type === 'DIAMOND') {
    animatedStyle.transform = [{ rotate }];
  }

  return (
    <Animated.View
      style={[
        styles.food,
        {
          left: x * CELL_PX - size / 2,
          top: y * CELL_PX - size / 2,
          width: size,
          height: size,
          backgroundColor: config.color,
          borderRadius,
        },
        animatedStyle,
      ]}
    >
      {type === 'APPLE' && <View style={styles.foodLeaf} />}
      {type === 'STAR' && (
        <View style={[styles.starInner, { width: size * 0.4, height: size * 0.4 }]} />
      )}
    </Animated.View>
  );
};

const Minimap: React.FC<{
  snakeBody: Position[];
  foodPosition: Position;
  specialFood: { position: Position; type: FoodType } | null;
  offsetX: number;
  offsetY: number;
  colors: typeof THEME_COLORS.classic;
  aiSnakes?: { body: Position[]; color: string }[];
}> = ({ snakeBody, foodPosition, specialFood, offsetX, offsetY, colors, aiSnakes = [] }) => {
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
      {aiSnakes.map((ai, aiIdx) =>
        ai.body.map((seg, i) => (
          <View
            key={`ai-${aiIdx}-${i}`}
            style={[
              styles.minimapSnake,
              {
                left: seg.x * MINIMAP_SCALE - 1,
                top: seg.y * MINIMAP_SCALE - 1,
                backgroundColor: i === 0 ? ai.color : ai.color + 'AA',
              },
            ]}
          />
        ))
      )}
    </View>
  );
};

export const GameRenderer: React.FC<GameRendererProps> = ({
  snakeBody,
  foodPosition,
  foodType,
  specialFood,
  theme,
  aiSnakes = [],
  traps = [],
  fog = null,
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

  const aiSnakeElements = useMemo(() => {
    const segRadius = CELL_PX * 0.35;
    const elements: React.ReactNode[] = [];
    for (const ai of aiSnakes) {
      for (let i = 0; i < ai.body.length; i++) {
        const seg = ai.body[i];
        if (!isInViewport(seg.x, seg.y, offsetX, offsetY)) continue;
        const viewX = seg.x - offsetX;
        const viewY = seg.y - offsetY;
        const alpha = Math.max(0.3, 1 - (i / ai.body.length) * 0.7);
        const r = segRadius * (1 - i / ai.body.length * 0.3);
        if (i === 0) {
          elements.push(
            <SnakeHead key={`ai-${ai.name}-head`} x={viewX} y={viewY} color={ai.color} />
          );
        } else {
          elements.push(
            <SnakeSegment key={`ai-${ai.name}-${i}`} x={viewX} y={viewY} color={ai.color} alpha={alpha} radius={r} />
          );
        }
      }
    }
    return elements;
  }, [aiSnakes, offsetX, offsetY]);

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
        {aiSnakeElements}
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
        {/* Traps */}
        {traps.map((trap, i) => {
          if (!isInViewport(trap.x, trap.y, offsetX, offsetY)) return null;
          const viewX = (trap.x - offsetX) * CELL_PX;
          const viewY = (trap.y - offsetY) * CELL_PX;
          const size = trap.radius * CELL_PX * 2;
          let color = '#FF5722';
          if (trap.type === 'poison') color = '#9C27B0';
          if (trap.type === 'slow') color = '#FF9800';
          return (
            <View
              key={`trap-${i}`}
              style={{
                position: 'absolute',
                left: viewX - size / 2,
                top: viewY - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color + '40',
                borderWidth: 2,
                borderColor: color,
                borderStyle: 'dashed',
              }}
            />
          );
        })}
        {/* Poison Fog */}
        {fog && (
          <>
            {/* Top fog */}
            {fog.minY > 0 && (
              <View style={[styles.fogZone, { top: 0, left: 0, right: 0, height: (fog.minY - offsetY) * CELL_PX }]} />
            )}
            {/* Bottom fog */}
            {fog.maxY < GRID_SIZE && (
              <View style={[styles.fogZone, { bottom: 0, left: 0, right: 0, height: (GRID_SIZE - fog.maxY - offsetY) * CELL_PX }]} />
            )}
            {/* Left fog */}
            {fog.minX > 0 && (
              <View style={[styles.fogZone, { top: 0, left: 0, width: (fog.minX - offsetX) * CELL_PX, bottom: 0 }]} />
            )}
            {/* Right fog */}
            {fog.maxX < GRID_SIZE && (
              <View style={[styles.fogZone, { top: 0, right: 0, width: (GRID_SIZE - fog.maxX - offsetX) * CELL_PX, bottom: 0 }]} />
            )}
          </>
        )}
      </View>
      <Minimap
        snakeBody={snakeBody}
        foodPosition={foodPosition}
        specialFood={specialFood}
        offsetX={offsetX}
        offsetY={offsetY}
        colors={colors}
        aiSnakes={aiSnakes}
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
  starInner: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'center',
    marginTop: '30%',
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
  fogZone: {
    position: 'absolute',
    backgroundColor: 'rgba(128, 0, 128, 0.3)',
  },
});
