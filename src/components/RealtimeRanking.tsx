import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RankEntry {
  name: string;
  length: number;
  color: string;
  isPlayer: boolean;
}

interface Props {
  entries: RankEntry[];
}

export const RealtimeRanking: React.FC<Props> = ({ entries }) => {
  const sorted = [...entries].sort((a, b) => b.length - a.length).slice(0, 5);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 长度排行</Text>
      {sorted.map((entry, index) => (
        <View
          key={entry.name}
          style={[
            styles.row,
            entry.isPlayer && styles.playerRow,
          ]}
        >
          <Text style={styles.rank}>{index + 1}</Text>
          <View style={[styles.dot, { backgroundColor: entry.color }]} />
          <Text style={[styles.name, entry.isPlayer && styles.playerName]} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={[styles.length, entry.isPlayer && styles.playerLength]}>
            {entry.length}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 110,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 110,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 6,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  playerRow: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 4,
    marginVertical: 1,
  },
  rank: {
    fontSize: 11,
    fontWeight: '700',
    color: '#AAA',
    width: 16,
    textAlign: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  name: {
    fontSize: 11,
    color: '#CCC',
    flex: 1,
  },
  playerName: {
    color: '#FFF',
    fontWeight: '700',
  },
  length: {
    fontSize: 12,
    fontWeight: '700',
    color: '#AAA',
    marginLeft: 4,
  },
  playerLength: {
    color: '#4CAF50',
  },
});
