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

  return (
    <View style={[styles.container, { backgroundColor: THEME_COLORS[theme].background }]}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <Text style={styles.snakeEmoji}>🐍</Text>
        <Text style={styles.title}>Snake</Text>
        <Text style={styles.subtitle}>Fighting</Text>
      </View>

      {/* Theme selection */}
      <Text style={styles.sectionLabel}>选择主题</Text>
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
      <Text style={styles.sectionLabel}>选择模式</Text>
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeCard, gameMode === 'classic' && styles.modeCardActive]}
          onPress={() => dispatch(setGameMode('classic'))}
        >
          <Text style={styles.modeEmoji}>🎮</Text>
          <Text style={styles.modeName}>经典模式</Text>
          <Text style={styles.modeDesc}>撞墙即死</Text>
          <Text style={styles.modeSubDesc}>有难度选择</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeCard, gameMode === 'endless' && styles.modeCardActive]}
          onPress={() => dispatch(setGameMode('endless'))}
        >
          <Text style={styles.modeEmoji}>♾️</Text>
          <Text style={styles.modeName}>无尽模式</Text>
          <Text style={styles.modeDesc}>穿墙不死</Text>
          <Text style={styles.modeSubDesc}>挑战最高分</Text>
        </TouchableOpacity>
      </View>

      {/* Difficulty selection - only for classic mode */}
      {gameMode === 'classic' && (
        <>
          <Text style={styles.sectionLabel}>选择难度</Text>
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
                  <Text style={styles.diffAI}>{config.aiCount}个AI</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.diffDesc}>{DIFFICULTY_CONFIG[difficulty].description}</Text>
        </>
      )}

      {/* Endless mode info */}
      {gameMode === 'endless' && (
        <View style={styles.endlessInfo}>
          <Text style={styles.endlessText}>🎯 蛇撞墙会穿越到对面</Text>
          <Text style={styles.endlessText}>🤖 5个AI对手</Text>
          <Text style={styles.endlessText}>📈 看你能得多少分！</Text>
        </View>
      )}

      {/* Start button */}
      <TouchableOpacity style={[styles.startBtn, { backgroundColor: THEME_COLORS[theme].snake }]} onPress={handleStart}>
        <Text style={styles.startText}>开始游戏</Text>
      </TouchableOpacity>

      {/* Bottom row */}
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
  logoArea: { alignItems: 'center', marginBottom: 20 },
  snakeEmoji: { fontSize: 70, marginBottom: 4 },
  title: { fontSize: 40, fontWeight: '800', color: '#2E7D32', letterSpacing: 4 },
  subtitle: { fontSize: 22, fontWeight: '300', color: '#4CAF50', letterSpacing: 8, marginTop: -4 },
  sectionLabel: { fontSize: 13, color: '#666', fontWeight: '600', marginBottom: 8, marginTop: 12, alignSelf: 'flex-start', marginLeft: 8 },
  themeRow: { flexDirection: 'row', marginBottom: 8, gap: 10 },
  themeBtn: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  themeBtnActive: { opacity: 1, transform: [{ scale: 1.1 }], shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  themeIcon: { fontSize: 20 },
  themeLabel: { fontSize: 9, color: '#FFF', fontWeight: '600', marginTop: 2 },
  modeRow: { flexDirection: 'row', marginBottom: 8, gap: 12 },
  modeCard: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  modeCardActive: {
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  modeEmoji: { fontSize: 28 },
  modeName: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 6 },
  modeDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  modeSubDesc: { fontSize: 10, color: '#AAA', marginTop: 1 },
  difficultyRow: { flexDirection: 'row', marginBottom: 6, gap: 8 },
  diffBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', opacity: 0.6 },
  diffBtnActive: { opacity: 1, transform: [{ scale: 1.05 }], shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 5 },
  diffEmoji: { fontSize: 20 },
  diffLabel: { fontSize: 12, color: '#FFF', fontWeight: '700', marginTop: 2 },
  diffAI: { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  diffDesc: { fontSize: 11, color: '#888', marginBottom: 12 },
  endlessInfo: {
    backgroundColor: 'rgba(0,188,212,0.1)', borderRadius: 14, padding: 16,
    marginBottom: 16, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,188,212,0.3)',
  },
  endlessText: { fontSize: 13, color: '#555', marginVertical: 3 },
  startBtn: { width: screenWidth * 0.5, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
  startText: { color: '#FFF', fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  bottomRow: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  scoreBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14 },
  scoreLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  scoreValue: { fontSize: 26, fontWeight: '800', marginTop: 1 },
  iconBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 3 },
  iconEmoji: { fontSize: 18 },
  iconLabel: { fontSize: 9, color: '#FFF', fontWeight: '600', marginTop: 2 },
});
