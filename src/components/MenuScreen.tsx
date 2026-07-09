import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setPlaying, resetGame, setTheme } from '../store/gameSlice';
import { Theme, THEME_COLORS } from '../utils/constants';

export const MenuScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { highScore, theme } = useSelector((state: RootState) => state.game);

  const handleStart = () => {
    dispatch(resetGame());
    dispatch(setPlaying(true));
  };

  const themes: Theme[] = ['classic', 'beach', 'ice', 'space'];

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🐍</Text>
        <Text style={styles.title}>Snake Fighting</Text>
      </View>

      <View style={styles.themeContainer}>
        {themes.map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.themeButton,
              { backgroundColor: THEME_COLORS[t].snake },
              theme === t && styles.themeButtonActive,
            ]}
            onPress={() => dispatch(setTheme(t))}
          >
            <Text style={styles.themeText}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startText}>开始游戏</Text>
      </TouchableOpacity>

      <View style={styles.highScoreContainer}>
        <Text style={styles.highScoreLabel}>最高分</Text>
        <Text style={styles.highScore}>{highScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 10,
  },
  themeContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  themeButtonActive: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  themeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  highScoreContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  highScoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  highScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
  },
});
