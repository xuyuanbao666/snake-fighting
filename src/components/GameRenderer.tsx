import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import { CELL_SIZE, GRID_SIZE, THEME_COLORS, Theme, FoodType, FOOD_CONFIG } from '../utils/constants';
import { Position } from '../store/gameSlice';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const MINIMAP_SIZE = 90;
const MINIMAP_SCALE = MINIMAP_SIZE / GRID_SIZE;

interface GameRendererProps {
  snakeBody: Position[];
  foods: { position: Position; type: FoodType }[];
  theme: Theme;
  aiSnakes?: { body: Position[]; color: string; name: string }[];
  traps?: { x: number; y: number; type: string; radius: number }[];
  fog?: { minX: number; minY: number; maxX: number; maxY: number } | null;
}

const SnakeHead: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => {
  const size = CELL_SIZE * 1.2;
  return (
    <View style={[styles.head, { left: x * CELL_SIZE - size / 2, top: y * CELL_SIZE - size / 2, width: size, height: size, backgroundColor: color }]}>
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
  <View style={[styles.segment, { left: x * CELL_SIZE - radius, top: y * CELL_SIZE - radius, width: radius * 2, height: radius * 2, backgroundColor: color, opacity: alpha, borderRadius: radius }]} />
);

const FoodItem: React.FC<{ x: number; y: number; type: FoodType; theme: Theme }> = ({ x, y, type, theme }) => {
  const config = FOOD_CONFIG[type];
  let size = CELL_SIZE * 0.8;
  let borderRadius = size / 2;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  if (type === 'STAR') { size = CELL_SIZE * 0.7; }
  else if (type === 'APPLE') { size = CELL_SIZE * 0.85; }
  else if (type === 'DIAMOND') { size = CELL_SIZE * 0.95; borderRadius = CELL_SIZE * 0.15; }

  useEffect(() => {
    if (type === 'STAR') {
      const a = Animated.loop(Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
      ]));
      a.start();
      return () => a.stop();
    }
  }, [type]);

  useEffect(() => {
    if (type === 'APPLE') {
      const a = Animated.loop(Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 600, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
      ]));
      a.start();
      return () => a.stop();
    }
  }, [type]);

  useEffect(() => {
    if (type === 'DIAMOND') {
      const a = Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 1200, useNativeDriver: false }));
      a.start();
      return () => a.stop();
    }
  }, [type]);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const glowSize = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [size * 1.3, size * 2] });
  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const animStyle: any = {};
  if (type === 'STAR') { animStyle.shadowOpacity = glowOpacity; animStyle.shadowRadius = 20; animStyle.shadowColor = '#FFD700'; animStyle.shadowOffset = { width: 0, height: 0 }; animStyle.elevation = 10; }
  else if (type === 'DIAMOND') { animStyle.transform = [{ rotate }]; animStyle.shadowOpacity = 0.9; animStyle.shadowRadius = 15; animStyle.shadowColor = '#00BCD4'; animStyle.elevation = 10; }
  else if (type === 'APPLE') { animStyle.transform = [{ scale: scaleAnim }]; }

  return (
    <Animated.View style={[styles.food, { left: x * CELL_SIZE - size / 2, top: y * CELL_SIZE - size / 2, width: size, height: size, backgroundColor: config.color, borderRadius }, animStyle]}>
      {type === 'APPLE' && <View style={styles.foodLeaf} />}
      {type === 'STAR' && <Animated.View style={[styles.starGlow, { width: glowSize, height: glowSize, borderRadius: 100, opacity: glowOpacity }]} />}
      {type === 'DIAMOND' && <View style={styles.diamondShine} />}
    </Animated.View>
  );
};

export const GameRenderer: React.FC<GameRendererProps> = ({
  snakeBody, foods, theme, aiSnakes = [], traps = [], fog = null,
}) => {
  const colors = THEME_COLORS[theme];
  const [dims, setDims] = useState({ w: screenWidth, h: screenHeight });

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims({ w: window.width, h: window.height }));
    return () => sub?.remove?.();
  }, []);

  const head = snakeBody && snakeBody.length > 0 ? snakeBody[0] : { x: 50, y: 50 };

  // Calculate viewport: center on snake head
  const viewW = dims.w;
  const viewH = dims.h;
  const viewCols = Math.ceil(viewW / CELL_SIZE) + 2;
  const viewRows = Math.ceil(viewH / CELL_SIZE) + 2;
  const halfCols = viewCols / 2;
  const halfRows = viewRows / 2;

  let offsetX = head.x - halfCols;
  let offsetY = head.y - halfRows;
  offsetX = Math.max(0, Math.min(offsetX, GRID_SIZE - viewCols));
  offsetY = Math.max(0, Math.min(offsetY, GRID_SIZE - viewRows));

  const inView = (x: number, y: number) =>
    x >= offsetX - 2 && x <= offsetX + viewCols + 2 && y >= offsetY - 2 && y <= offsetY + viewRows + 2;

  const snakeSegments = useMemo(() => {
    if (!snakeBody || snakeBody.length === 0) return null;
    const segR = CELL_SIZE * 0.4;
    return snakeBody.map((seg, i) => {
      if (!inView(seg.x, seg.y)) return null;
      const vx = seg.x - offsetX;
      const vy = seg.y - offsetY;
      if (i === 0) return <SnakeHead key="head" x={vx} y={vy} color={colors.snake} />;
      const alpha = Math.max(0.3, 1 - (i / snakeBody.length) * 0.7);
      const r = segR * (1 - i / snakeBody.length * 0.3);
      return <SnakeSegment key={i} x={vx} y={vy} color={colors.snake} alpha={alpha} radius={r} />;
    });
  }, [snakeBody, offsetX, offsetY, colors.snake, dims]);

  const foodElements = useMemo(() =>
    foods.filter(f => inView(f.position.x, f.position.y)).map((f, i) => (
      <FoodItem key={i} x={f.position.x - offsetX} y={f.position.y - offsetY} type={f.type} theme={theme} />
    )),
    [foods, offsetX, offsetY, theme, dims]);

  const aiElements = useMemo(() => {
    const segR = CELL_SIZE * 0.35;
    const els: React.ReactNode[] = [];
    for (const ai of aiSnakes) {
      if (!ai.body || ai.body.length === 0) continue;
      for (let i = 0; i < ai.body.length; i++) {
        const s = ai.body[i];
        if (!inView(s.x, s.y)) continue;
        const vx = s.x - offsetX;
        const vy = s.y - offsetY;
        const alpha = Math.max(0.25, 1 - (i / ai.body.length) * 0.75);
        const r = segR * (1 - i / ai.body.length * 0.3);
        if (i === 0) els.push(<SnakeHead key={`ai-${ai.name}-h`} x={vx} y={vy} color={ai.color} />);
        else els.push(<SnakeSegment key={`ai-${ai.name}-${i}`} x={vx} y={vy} color={ai.color} alpha={alpha} radius={r} />);
      }
    }
    return els;
  }, [aiSnakes, offsetX, offsetY, dims]);

  const trapElements = useMemo(() =>
    traps.filter(t => t.active && inView(t.x, t.y)).map((t, i) => {
      const vx = (t.x - offsetX) * CELL_SIZE;
      const vy = (t.y - offsetY) * CELL_SIZE;
      const sz = t.radius * CELL_SIZE * 2;
      const c = t.type === 'spike' ? '#FF5722' : t.type === 'poison' ? '#9C27B0' : '#FF9800';
      return <View key={`t${i}`} style={{ position: 'absolute', left: vx - sz / 2, top: vy - sz / 2, width: sz, height: sz, borderRadius: sz / 2, backgroundColor: c + '40', borderWidth: 2, borderColor: c, borderStyle: 'dashed' }} />;
    }),
    [traps, offsetX, offsetY, dims]);

  const fogElements = useMemo(() => {
    if (!fog) return null;
    const l = Math.max(0, (fog.minX - offsetX) * CELL_SIZE);
    const t = Math.max(0, (fog.minY - offsetY) * CELL_SIZE);
    const r = Math.max(0, (GRID_SIZE - fog.maxX - offsetX) * CELL_SIZE);
    const b = Math.max(0, (GRID_SIZE - fog.maxY - offsetY) * CELL_SIZE);
    return (
      <>
        {t > 0 && <View style={[styles.fog, { top: 0, left: 0, right: 0, height: t }]} />}
        {b > 0 && <View style={[styles.fog, { bottom: 0, left: 0, right: 0, height: b }]} />}
        {l > 0 && <View style={[styles.fog, { top: 0, left: 0, bottom: 0, width: l }]} />}
        {r > 0 && <View style={[styles.fog, { top: 0, right: 0, bottom: 0, width: l }]} />}
      </>
    );
  }, [fog, offsetX, offsetY, dims]);

  if (!snakeBody || snakeBody.length === 0) {
    return <View style={[styles.root, { width: dims.w, height: dims.h, backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.root, { width: dims.w, height: dims.h }]}>
      <View style={[styles.board, { backgroundColor: colors.background, width: dims.w, height: dims.h }]}>
        {/* Grid lines */}
        {Array.from({ length: viewCols }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLineV, { left: (i + 1) * CELL_SIZE }]} />
        ))}
        {Array.from({ length: viewRows }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLineH, { top: (i + 1) * CELL_SIZE }]} />
        ))}
        {foodElements}
        {trapElements}
        {aiElements}
        {snakeSegments}
        {fogElements}
      </View>

      {/* Minimap */}
      <View style={styles.minimap}>
        <View style={styles.minimapBg}>
          {/* Viewport indicator */}
          <View style={[styles.minimapVP, {
            left: offsetX * MINIMAP_SCALE,
            top: offsetY * MINIMAP_SCALE,
            width: Math.min(viewCols, GRID_SIZE) * MINIMAP_SCALE,
            height: Math.min(viewRows, GRID_SIZE) * MINIMAP_SCALE,
          }]} />
          {/* Foods */}
          {foods.map((f, i) => (
            <View key={i} style={[styles.minimapDot, {
              left: f.position.x * MINIMAP_SCALE - 1.5,
              top: f.position.y * MINIMAP_SCALE - 1.5,
              backgroundColor: f.type === 'STAR' ? '#FFD700' : f.type === 'APPLE' ? '#F44336' : '#00BCD4',
            }]} />
          ))}
          {/* Snake */}
          {snakeBody.map((s, i) => (
            <View key={i} style={[styles.minimapDot, {
              left: s.x * MINIMAP_SCALE - 1.5,
              top: s.y * MINIMAP_SCALE - 1.5,
              backgroundColor: i === 0 ? '#FFF' : colors.snake,
              width: i === 0 ? 4 : 3,
              height: i === 0 ? 4 : 3,
            }]} />
          ))}
          {/* AI snakes */}
          {aiSnakes.map((ai, i) => (
            <View key={i} style={[styles.minimapDot, {
              left: ai.body[0].x * MINIMAP_SCALE - 1.5,
              top: ai.body[0].y * MINIMAP_SCALE - 1.5,
              backgroundColor: ai.color,
              width: 4,
              height: 4,
            }]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  board: { flex: 1, position: 'relative', overflow: 'hidden' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  head: { position: 'absolute', borderRadius: 100 },
  eye: { position: 'absolute', width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFF' },
  eyePupil: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#333' },
  segment: { position: 'absolute' },
  food: { position: 'absolute' },
  foodLeaf: { position: 'absolute', top: -5, right: -2, width: 10, height: 7, borderRadius: 3, backgroundColor: '#4CAF50', transform: [{ rotate: '30deg' }] },
  starGlow: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(255,215,0,0.4)' },
  diamondShine: { position: 'absolute', top: 2, left: 2, width: 7, height: 7, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)' },
  fog: { position: 'absolute', backgroundColor: 'rgba(100,0,100,0.35)' },
  minimap: { position: 'absolute', top: 90, right: 10 },
  minimapBg: { width: MINIMAP_SIZE, height: MINIMAP_SIZE, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', position: 'relative' },
  minimapVP: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', borderRadius: 1 },
  minimapDot: { position: 'absolute', width: 3, height: 3, borderRadius: 1.5 },
});
