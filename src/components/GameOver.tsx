import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Dimensions } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { resetGame, setPlaying } from '../store/gameSlice';
import { THEME_COLORS } from '../utils/constants';

const { width: screenWidth } = Dimensions.get('window');

export const GameOver: React.FC = () => {
  const dispatch = useDispatch();
  const { score, highScore, theme } = useSelector((state: RootState) => state.game);

  const handleRestart = () => {
    dispatch(resetGame());
    dispatch(setPlaying(true));
  };

  const handleBackToMenu = () => {
    dispatch(resetGame());
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
  const colors = THEME_COLORS[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.card}>
        <Text style={styles.gameOverEmoji}>💀</Text>
        <Text style={styles.gameOverText}>游戏结束</Text>

        {isNewHighScore && (
          <View style={styles.newRecordBadge}>
            <Text style={styles.newRecordText}>🎉 新纪录！</Text>
          </View>
        )}

        <View style={styles.scoreSection}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>得分</Text>
            <Text style={[styles.scoreItemValue, { color: colors.snake }]}>{score}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreItem}>
            <Text style={styles.scoreItemLabel}>最高</Text>
            <Text style={[styles.scoreItemValue, { color: '#FF9800' }]}>{highScore}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.restartBtn, { backgroundColor: colors.snake }]}
          onPress={handleRestart}
        >
          <Text style={styles.restartBtnText}>再来一局</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.bottomBtn} onPress={handleBackToMenu}>
            <Text style={styles.bottomBtnText}>返回大厅</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBtn} onPress={handleShare}>
            <Text style={styles.bottomBtnText}>分享成绩</Text>
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
    width: screenWidth * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  gameOverEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20,
  },
  newRecordBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  newRecordText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9800',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
    justifyContent: 'center',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreItemLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    marginBottom: 6,
  },
  scoreItemValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  scoreDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#EEE',
  },
  restartBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  restartBtnText: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 20,
  },
  bottomBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bottomBtnText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});
