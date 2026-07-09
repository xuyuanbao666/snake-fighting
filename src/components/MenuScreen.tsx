import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setPlaying, resetGame, setTheme } from '../store/gameSlice';
import { Theme, THEME_COLORS } from '../utils/constants';

const { width: screenWidth } = Dimensions.get('window');

export const MenuScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { highScore, theme } = useSelector((state: RootState) => state.game);

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

      <TouchableOpacity style={[styles.startBtn, { backgroundColor: THEME_COLORS[theme].snake }]} onPress={handleStart}>
        <Text style={styles.startText}>开始游戏</Text>
      </TouchableOpacity>

      <View style={styles.scoreBox}>
        <Text style={styles.scoreLabel}>最高分</Text>
        <Text style={[styles.scoreValue, { color: THEME_COLORS[theme].snake }]}>{highScore}</Text>
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
    marginBottom: 50,
  },
  snakeEmoji: {
    fontSize: 100,
    marginBottom: 10,
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
    marginBottom: 40,
    gap: 12,
  },
  themeBtn: {
    width: 70,
    height: 70,
    borderRadius: 20,
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
    fontSize: 24,
  },
  themeLabel: {
    fontSize: 11,
    color: '#FFF',
    fontWeight: '600',
    marginTop: 4,
  },
  startBtn: {
    width: screenWidth * 0.65,
    height: 56,
    borderRadius: 28,
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
  scoreBox: {
    marginTop: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 16,
  },
  scoreLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '800',
    marginTop: 4,
  },
});
