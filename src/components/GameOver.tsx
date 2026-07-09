import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { resetGame, setPlaying } from '../store/gameSlice';

export const GameOver: React.FC = () => {
  const dispatch = useDispatch();
  const { score, highScore } = useSelector((state: RootState) => state.game);

  const handleRestart = () => {
    dispatch(resetGame());
    dispatch(setPlaying(true));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我在 Snake Fighting 中获得了 ${score} 分！来挑战我吧！`,
      });
    } catch (error) {
      console.error('分享失败:', error);
    }
  };

  const isNewHighScore = score >= highScore && score > 0;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>游戏结束</Text>

        {isNewHighScore && (
          <Text style={styles.newHighScore}>新纪录！</Text>
        )}

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>得分</Text>
          <Text style={styles.score}>{score}</Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>最高分</Text>
          <Text style={styles.highScore}>{highScore}</Text>
        </View>

        <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
          <Text style={styles.restartText}>重新开始</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareText}>分享成绩</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 20,
  },
  newHighScore: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 15,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  highScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  restartText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  shareButton: {
    marginTop: 15,
  },
  shareText: {
    color: '#2196F3',
    fontSize: 16,
  },
});
