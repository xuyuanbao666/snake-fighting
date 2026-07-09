import AsyncStorage from '@react-native-async-storage/async-storage';
import { Storage } from './storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save high score', async () => {
    await Storage.saveHighScore('classic', 100);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('highScore_classic', '100');
  });

  it('should get high score', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('100');
    const score = await Storage.getHighScore('classic');
    expect(score).toBe(100);
  });

  it('should return 0 for non-existent high score', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    const score = await Storage.getHighScore('classic');
    expect(score).toBe(0);
  });

  it('should save settings', async () => {
    const settings = { soundEnabled: true, vibrationEnabled: false, controlType: 'swipe' as const };
    await Storage.saveSettings(settings);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('settings', JSON.stringify(settings));
  });

  it('should get settings', async () => {
    const settings = { soundEnabled: true, vibrationEnabled: false, controlType: 'swipe' as const };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(settings));
    const result = await Storage.getSettings();
    expect(result).toEqual(settings);
  });
});
