import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme } from './constants';

export class Storage {
  static async saveHighScore(theme: Theme, score: number): Promise<void> {
    await AsyncStorage.setItem(`highScore_${theme}`, score.toString());
  }

  static async getHighScore(theme: Theme): Promise<number> {
    const score = await AsyncStorage.getItem(`highScore_${theme}`);
    return score ? parseInt(score, 10) : 0;
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
