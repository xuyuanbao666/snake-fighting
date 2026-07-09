import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { CELL_SIZE, GRID_SIZE, VIEWPORT_CELLS, THEME_COLORS, Theme, FoodType, FOOD_CONFIG } from '../utils/constants';
import { Position } from '../store/gameSlice';

function getViewportSize() {
  const { width, height } = Dimensions.get('window');
  // Use the larger dimension for fullscreen
  return Math.max(width, height);
}

function getCellPx() {
  return getViewportSize() / VIEWPORT_CELLS;
}

const MINIMAP_SIZE = 80;
const MINIMAP_SCALE = MINIMAP_SIZE / GRID_SIZE;

interface GameRendererProps {
  snakeBody: Position[];
  foods: { position: Position; type: FoodType }[];
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

const SnakeHead: React.FC<{ x: number; y: number; color: string; cellPx: number }> = ({ x, y, color, cellPx }) => {
  const size = cellPx * 1.1;
  return (
    <View
      style={[
        styles.head,
        {
          left: x * cellPx - size / 2,
          top: y * cellPx - size / 2,
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
        left: x * getCellPx() - radius,
        top: y * getCellPx() - radius,
        width: radius * 2,
        height: radius * 2,
        backgroundColor: color,
        opacity: alpha,
        borderRadius: radius,
      },
    ]}
  />
);

const FoodItem: React.FC<{ x: number; y: number; type: FoodType; theme: Theme; cellPx: number }> = ({ x, y, type, theme, cellPx }) => {
  const config = FOOD_CONFIG[type];
  let size = cellPx * 0.7;
  let borderRadius = size / 2;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (type === 'STAR') {
    size = cellPx * 0.7;
  } else if (type === 'APPLE') {
    size = cellPx * 0.8;
  } else if (type === 'DIAMOND') {
    size = cellPx * 0.9;
    borderRadius = cellPx * 0.15;
  }

  useEffect(() => {
    if (type === 'STAR') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [type]);

  useEffect(() => {
    if (type === 'APPLE') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.15, duration: 600, useNativeDriver: false }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [type]);

  useEffect(() => {
    if (type === 'DIAMOND') {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, { toValue: 1, duration: 1200, useNativeDriver: false })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [type]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  const glowSize = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [size * 1.2, size * 1.8],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle: any = {};
  if (type === 'STAR') {
    animatedStyle.shadowOpacity = glowOpacity;
    animatedStyle.shadowRadius = 16;
    animatedStyle.shadowColor = '#FFD700';
    animatedStyle.shadowOffset = { width: 0, height: 0 };
    animatedStyle.elevation = 8;
  } else if (type === 'DIAMOND') {
    animatedStyle.transform = [{ rotate }];
    animatedStyle.shadowOpacity = 0.8;
    animatedStyle.shadowRadius = 12;
    animatedStyle.shadowColor = '#00BCD4';
    animatedStyle.shadowOffset = { width: 0, height: 0 };
    animatedStyle.elevation = 8;
  } else if (type === 'APPLE') {
    animatedStyle.transform = [{ scale: scaleAnim }];
  }

  return (
    <Animated.View
      style={[
        styles.food,
        {
          left: x * cellPx - size / 2,
          top: y * cellPx - size / 2,
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
        <Animated.View style={[styles.starGlow, {
          width: glowSize,
          height: glowSize,
          borderRadius: 100,
          opacity: glowOpacity,
        }]} />
      )}
      {type === 'DIAMOND' && (
        <View style={styles.diamondShine} />
      )}
    </Animated.View>
  );
};

const Minimap: React.FC<{
  snakeBody: Position[];
  foods: { position: Position; type: FoodType }[];
  offsetX: number;
  offsetY: number;
  colors: typeof THEME_COLORS.classic;
  aiSnakes?: { body: Position[]; color: string }[];
}> = ({ snakeBody, foods, offsetX, offsetY, colors, aiSnakes = [] }) => {
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
      {foods.map((food, i) => (
        <View
          key={i}
          style={[
            styles.minimapFood,
            {
              left: food.position.x * MINIMAP_SCALE - 1.5,
              top: food.position.y * MINIMAP_SCALE - 1.5,
              backgroundColor: food.type === 'STAR' ? '#FFD700' : food.type === 'APPLE' ? '#F44336' : '#00BCD4',
            },
          ]}
        />
      ))}
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
  foods,
  theme,
  aiSnakes = [],
  traps = [],
  fog = null,
}) => {
  const colors = THEME_COLORS[theme];
  const head = snakeBody[0];
  const { offsetX, offsetY } = getViewportOffset(head.x, head.y);
  const [viewportSize, setViewportSize] = useState(getViewportSize());
  const cellPx = viewportSize / VIEWPORT_CELLS;

  // Listen for dimension changes (orientation)
  useEffect(() => {
    const onChange = () => {
      setViewportSize(getViewportSize());
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove?.();
  }, []);

  const snakeSegments = useMemo(() => {
    const segRadius = cellPx * 0.4;
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
            cellPx={cellPx}
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
  }, [snakeBody, offsetX, offsetY, colors.snake, cellPx]);

  const foodElements = useMemo(() => {
    return foods.map((food, i) => {
      if (!isInViewport(food.position.x, food.position.y, offsetX, offsetY)) return null;
      return (
        <FoodItem
          key={i}
          x={food.position.x - offsetX}
          y={food.position.y - offsetY}
          type={food.type}
          theme={theme}
          cellPx={cellPx}
        />
      );
    }).filter(Boolean);
  }, [foods, offsetX, offsetY, theme, cellPx]);

  const aiSnakeElements = useMemo(() => {
    const segRadius = cellPx * 0.35;
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
            <SnakeHead key={`ai-${ai.name}-head`} x={viewX} y={viewY} color={ai.color} cellPx={cellPx} />
          );
        } else {
          elements.push(
            <SnakeSegment key={`ai-${ai.name}-${i}`} x={viewX} y={viewY} color={ai.color} alpha={alpha} radius={r} />
          );
        }
      }
    }
    return elements;
  }, [aiSnakes, offsetX, offsetY, cellPx]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.board, { backgroundColor: colors.background, flex: 1 }]}>
        <View style={[styles.gridOverlay, { borderColor: colors.snake + '15' }]}>
          {Array.from({ length: VIEWPORT_CELLS - 1 }).map((_, i) => (
            <View key={`h${i}`} style={[styles.gridLineH, { top: (i + 1) * cellPx }]} />
          ))}
          {Array.from({ length: VIEWPORT_CELLS - 1 }).map((_, i) => (
            <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * cellPx }]} />
          ))}
        </View>
        {snakeSegments}
        {aiSnakeElements}
        {foodElements}
        {/* Traps */}
        {traps.map((trap, i) => {
          if (!isInViewport(trap.x, trap.y, offsetX, offsetY)) return null;
          const viewX = (trap.x - offsetX) * cellPx;
          const viewY = (trap.y - offsetY) * cellPx;
          const size = trap.radius * cellPx * 2;
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
            {fog.minY > 0 && (
              <View style={[styles.fogZone, { top: 0, left: 0, right: 0, height: (fog.minY - offsetY) * cellPx }]} />
            )}
            {fog.maxY < GRID_SIZE && (
              <View style={[styles.fogZone, { bottom: 0, left: 0, right: 0, height: (GRID_SIZE - fog.maxY - offsetY) * cellPx }]} />
            )}
            {fog.minX > 0 && (
              <View style={[styles.fogZone, { top: 0, left: 0, width: (fog.minX - offsetX) * cellPx, bottom: 0 }]} />
            )}
            {fog.maxX < GRID_SIZE && (
              <View style={[styles.fogZone, { top: 0, right: 0, width: (GRID_SIZE - fog.maxX - offsetX) * cellPx, bottom: 0 }]} />
            )}
          </>
        )}
      </View>
      <Minimap
        snakeBody={snakeBody}
        foods={foods}
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
    overflow: 'hidden',
    position: 'relative',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    top: -6,
    right: -3,
    width: 12,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    transform: [{ rotate: '30deg' }],
  },
  foodGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
  },
  starGlow: {
    position: 'absolute',
    alignSelf: 'center',
    marginTop: -4,
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
  },
  diamondShine: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
