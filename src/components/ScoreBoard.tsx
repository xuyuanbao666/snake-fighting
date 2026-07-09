import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setPaused } from '../store/gameSlice';

export const ScoreBoard: React.FC = () => {
  const dispatch = useDispatch();
  const { score, highScore, isPaused } = useSelector((state: RootState) => state.game);

  return (
    <View style={styles.container}>
      <View style={styles.scoreContainer}>
        <Text style={styles.label}>分数</Text>
        <Text style={styles.score}>{score}</Text>
      </View>
      <TouchableOpacity
        style={styles.pauseButton}
        onPress={() => dispatch(setPaused(!isPaused))}
      >
        <Text style={styles.pauseText}>{isPaused ? '▶' : '⏸'}</Text>
      </TouchableOpacity>
      <View style={styles.scoreContainer}>
        <Text style={styles.label}>最高分</Text>
        <Text style={styles.score}>{highScore}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginHorizontal: 10,
    marginTop: 10,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseText: {
    fontSize: 20,
    color: '#FFF',
  },
});
