import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from './constants';

export interface LeaderboardEntry {
  score: number;
  length: number;
  date: string;
  theme: Theme;
}

export class Storage {
  static async saveHighScore(theme: Theme, score: number): Promise<void> {
    await AsyncStorage.setItem(`highScore_${theme}`, score.toString());
  }

  static async getHighScore(theme: Theme): Promise<number> {
    const score = await AsyncStorage.getItem(`highScore_${theme}`);
    return score ? parseInt(score, 10) : 0;
  }

  static async addToLeaderboard(entry: LeaderboardEntry): Promise<void> {
    const board = await this.getLeaderboard();
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    const top10 = board.slice(0, 10);
    await AsyncStorage.setItem('leaderboard', JSON.stringify(top10));
  }

  static async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const data = await AsyncStorage.getItem('leaderboard');
    return data ? JSON.parse(data) : [];
  }

  static async saveSettings(settings: {
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    controlType: 'swipe' | 'buttons';
  }): Promise<void> {
    await AsyncStorage.setItem('settings', JSON.stringify(settings));
  }

  static async getSettings(): Promise<{
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    controlType: 'swipe' | 'buttons';
  }> {
    const settings = await AsyncStorage.getItem('settings');
    return settings ? JSON.parse(settings) : {
      soundEnabled: true,
      vibrationEnabled: true,
      controlType: 'swipe',
    };
  }
}
