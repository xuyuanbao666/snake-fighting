import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setPlaying, resetGame, setTheme, setDifficulty, toggleOrientation, Difficulty, DIFFICULTY_CONFIG } from '../store/gameSlice';
import { Theme, THEME_COLORS } from '../utils/constants';
import { LeaderboardScreen } from './LeaderboardScreen';

const { width: screenWidth } = Dimensions.get('window');

export const MenuScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { highScore, theme, difficulty, orientation } = useSelector((state: RootState) => state.game);
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

  return (
    <View style={[styles.container, { backgroundColor: THEME_COLORS[theme].background }]}>
      <View style={styles.logoArea}>
        <Text style={styles.snakeEmoji}>🐍</Text>
        <Text style={styles.title}>Snake</Text>
        <Text style={styles.subtitle}>Fighting</Text>
      </View>

      <View style={styles.themeRow}>
        {themes.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[
              styles.themeBtn,
              { backgroundColor: THEME_COLORS[t.key].snake },
              theme === t.key && styles.themeBtnActive,
            ]}
            onPress={() => dispatch(setTheme(t.key))}
          >
            <Text style={styles.themeIcon}>{t.icon}</Text>
            <Text style={styles.themeLabel}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.difficultyRow}>
        {difficulties.map((d) => {
          const config = DIFFICULTY_CONFIG[d.key];
          return (
            <TouchableOpacity
              key={d.key}
              style={[
                styles.diffBtn,
                { backgroundColor: d.color },
                difficulty === d.key && styles.diffBtnActive,
              ]}
              onPress={() => dispatch(setDifficulty(d.key))}
            >
              <Text style={styles.diffEmoji}>{config.emoji}</Text>
              <Text style={styles.diffLabel}>{config.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.diffDesc}>{DIFFICULTY_CONFIG[difficulty].description}</Text>

      <TouchableOpacity style={[styles.startBtn, { backgroundColor: THEME_COLORS[theme].snake }]} onPress={handleStart}>
        <Text style={styles.startText}>开始游戏</Text>
      </TouchableOpacity>

      <View style={styles.bottomRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>最高分</Text>
          <Text style={[styles.scoreValue, { color: THEME_COLORS[theme].snake }]}>{highScore}</Text>
        </View>
        <TouchableOpacity style={[styles.leaderboardBtn, { backgroundColor: THEME_COLORS[theme].snake }]} onPress={() => setShowLeaderboard(true)}>
          <Text style={styles.leaderboardIcon}>🏆</Text>
          <Text style={styles.leaderboardText}>排行榜</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.leaderboardBtn, { backgroundColor: '#666' }]}
          onPress={() => dispatch(toggleOrientation())}
        >
          <Text style={styles.leaderboardIcon}>{orientation === 'portrait' ? '📱' : '📺'}</Text>
          <Text style={styles.leaderboardText}>{orientation === 'portrait' ? '竖屏' : '横屏'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  snakeEmoji: {
    fontSize: 90,
    marginBottom: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#4CAF50',
    letterSpacing: 8,
    marginTop: -5,
  },
  themeRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  themeBtn: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  themeBtnActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  themeIcon: {
    fontSize: 22,
  },
  themeLabel: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 3,
  },
  difficultyRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 10,
  },
  diffBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    opacity: 0.6,
    minWidth: 60,
  },
  diffBtnActive: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  diffEmoji: {
    fontSize: 20,
  },
  diffLabel: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '700',
    marginTop: 2,
  },
  diffDesc: {
    fontSize: 12,
    color: '#888',
    marginBottom: 24,
  },
  startBtn: {
    width: screenWidth * 0.6,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  startText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bottomRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  leaderboardBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  leaderboardIcon: {
    fontSize: 22,
  },
  leaderboardText: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 3,
  },
});
