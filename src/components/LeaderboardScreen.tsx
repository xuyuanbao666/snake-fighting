import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { THEME_COLORS } from '../utils/constants';
import { Storage, LeaderboardEntry } from '../utils/storage';

const { width: screenWidth } = Dimensions.get('window');

interface Props {
  onClose: () => void;
}

export const LeaderboardScreen: React.FC<Props> = ({ onClose }) => {
  const { theme } = useSelector((state: RootState) => state.game);
  const colors = THEME_COLORS[theme];
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    Storage.getLeaderboard().then(setEntries);
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>排行榜</Text>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.snake }]} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyText}>还没有记录</Text>
          <Text style={styles.emptySubText}>开始游戏创造你的第一笔记录吧！</Text>
        </View>
      ) : (
        <>
          <View style={styles.tableHeader}>
            <Text style={[styles.colRank, styles.headerText]}>排名</Text>
            <Text style={[styles.colScore, styles.headerText]}>分数</Text>
            <Text style={[styles.colLength, styles.headerText]}>长度</Text>
            <Text style={[styles.colDate, styles.headerText]}>时间</Text>
          </View>
          <FlatList
            data={entries}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item, index }) => (
              <View style={[
                styles.row,
                index < 3 && styles.rowTop,
                index === 0 && { backgroundColor: '#FFD700' + '20' },
              ]}>
                <Text style={[styles.colRank, styles.rankText]}>{getMedal(index)}</Text>
                <Text style={[styles.colScore, styles.scoreText, { color: colors.snake }]}>{item.score}</Text>
                <Text style={[styles.colLength, styles.lengthText]}>{item.length}</Text>
                <Text style={[styles.colDate, styles.dateText]}>{formatDate(item.date)}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '700',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  rowTop: {
    borderRadius: 12,
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  colRank: {
    width: 50,
    textAlign: 'center',
  },
  colScore: {
    flex: 1,
    textAlign: 'center',
  },
  colLength: {
    width: 60,
    textAlign: 'center',
  },
  colDate: {
    width: 80,
    textAlign: 'right',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '800',
  },
  lengthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
});
