import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setPlaying, resetGame, setTheme, setDifficulty, setGameMode, toggleOrientation, Difficulty, DIFFICULTY_CONFIG, GameMode, GAME_MODE_CONFIG } from '../store/gameSlice';
import { Theme, THEME_COLORS } from '../utils/constants';
import { LeaderboardScreen } from './LeaderboardScreen';

const { width: screenWidth } = Dimensions.get('window');

export const MenuScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { highScore, theme, difficulty, gameMode, orientation } = useSelector((state: RootState) => state.game);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (showLeaderboard) {
    return <LeaderboardScreen onClose={() => setShowLeaderboard(false)} />;
  }

  const handleStart = () => {
    dispatch(resetGame());
    dispatch(setPlaying(true));
  };

  const themes: { key: Theme; label: string; icon: string }[] = [
    { key: 'classic', label: '草地', icon: '🌿' },
    { key: 'beach', label: '沙滩', icon: '🏖️' },
    { key: 'ice', label: '冰雪', icon: '❄️' },
    { key: 'space', label: '太空', icon: '🚀' },
  ];

  const difficulties: { key: Difficulty; color: string }[] = [
    { key: 'easy', color: '#4CAF50' },
    { key: 'hard', color: '#FF9800' },
    { key: 'hell', color: '#F44336' },
    { key: 'impossible', color: '#9C27B0' },
  ];

  const modes: { key: GameMode; color: string }[] = [
    { key: 'classic', color: '#2196F3' },
    { key: 'endless', color: '#00BCD4' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: THEME_COLORS[theme].background }]}>
      <View style={styles.logoArea}>
        <Text style={styles.snakeEmoji}>🐍</Text>
        <Text style={styles.title}>Snake</Text>
        <Text style={styles.subtitle}>Fighting</Text>
      </View>

      {/* Theme selection */}
      <View style={styles.themeRow}>
        {themes.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.themeBtn, { backgroundColor: THEME_COLORS[t.key].snake }, theme === t.key && styles.themeBtnActive]}
            onPress={() => dispatch(setTheme(t.key))}
          >
            <Text style={styles.themeIcon}>{t.icon}</Text>
            <Text style={styles.themeLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Game mode selection */}
      <View style={styles.modeRow}>
        {modes.map((m) => {
          const config = GAME_MODE_CONFIG[m.key];
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeBtn, { backgroundColor: m.color }, gameMode === m.key && styles.modeBtnActive]}
              onPress={() => dispatch(setGameMode(m.key))}
            >
              <Text style={styles.modeEmoji}>{config.emoji}</Text>
              <Text style={styles.modeLabel}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.modeDesc}>{GAME_MODE_CONFIG[gameMode].description}</Text>

      {/* Difficulty selection */}
      <View style={styles.difficultyRow}>
        {difficulties.map((d) => {
          const config = DIFFICULTY_CONFIG[d.key];
          return (
            <TouchableOpacity
              key={d.key}
              style={[styles.diffBtn, { backgroundColor: d.color }, difficulty === d.key && styles.diffBtnActive]}
              onPress={() => dispatch(setDifficulty(d.key))}
            >
              <Text style={styles.diffEmoji}>{config.emoji}</Text>
              <Text style={styles.diffLabel}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.diffDesc}>{DIFFICULTY_CONFIG[difficulty].description} · {DIFFICULTY_CONFIG[difficulty].aiCount}个AI</Text>

      <TouchableOpacity style={[styles.startBtn, { backgroundColor: THEME_COLORS[theme].snake }]} onPress={handleStart}>
        <Text style={styles.startText}>开始游戏</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>最高分</Text>
          <Text style={[styles.scoreValue, { color: THEME_COLORS[theme].snake }]}>{highScore}</Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: THEME_COLORS[theme].snake }]} onPress={() => setShowLeaderboard(true)}>
          <Text style={styles.iconEmoji}>🏆</Text>
          <Text style={styles.iconLabel}>排行榜</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#666' }]} onPress={() => dispatch(toggleOrientation())}>
          <Text style={styles.iconEmoji}>{orientation === 'portrait' ? '📺' : '📱'}</Text>
          <Text style={styles.iconLabel}>{orientation === 'portrait' ? '竖屏' : '横屏'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  logoArea: { alignItems: 'center', marginBottom: 30 },
  snakeEmoji: { fontSize: 80, marginBottom: 6 },
  title: { fontSize: 44, fontWeight: '800', color: '#2E7D32', letterSpacing: 4 },
  subtitle: { fontSize: 24, fontWeight: '300', color: '#4CAF50', letterSpacing: 8, marginTop: -4 },
  themeRow: { flexDirection: 'row', marginBottom: 16, gap: 10 },
  themeBtn: { width: 60, height: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
  themeBtnActive: { opacity: 1, transform: [{ scale: 1.1 }], shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  themeIcon: { fontSize: 20 },
  themeLabel: { fontSize: 9, color: '#FFF', fontWeight: '600', marginTop: 2 },
  modeRow: { flexDirection: 'row', marginBottom: 6, gap: 10 },
  modeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, alignItems: 'center', opacity: 0.6, minWidth: 100 },
  modeBtnActive: { opacity: 1, transform: [{ scale: 1.05 }], shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
  modeEmoji: { fontSize: 18 },
  modeLabel: { fontSize: 12, color: '#FFF', fontWeight: '700', marginTop: 2 },
  modeDesc: { fontSize: 11, color: '#888', marginBottom: 12 },
  difficultyRow: { flexDirection: 'row', marginBottom: 6, gap: 8 },
  diffBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignItems: 'center', opacity: 0.6, minWidth: 55 },
  diffBtnActive: { opacity: 1, transform: [{ scale: 1.08 }], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 5 },
  diffEmoji: { fontSize: 18 },
  diffLabel: { fontSize: 10, color: '#FFF', fontWeight: '700', marginTop: 2 },
  diffDesc: { fontSize: 11, color: '#888', marginBottom: 20 },
  startBtn: { width: screenWidth * 0.55, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
  startText: { color: '#FFF', fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  bottomRow: { marginTop: 28, flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  scoreLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  scoreValue: { fontSize: 28, fontWeight: '800', marginTop: 2 },
  iconBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  iconEmoji: { fontSize: 20 },
  iconLabel: { fontSize: 10, color: '#FFF', fontWeight: '600', marginTop: 2 },
});
