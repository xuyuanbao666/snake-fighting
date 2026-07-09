import Sound from 'react-native-sound';

Sound.setCategory('Playback');

export class SoundManager {
  private sounds: Map<string, Sound> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.loadSounds();
  }

  private loadSounds(): void {
    const soundFiles = {
      eat: 'eat',
      special: 'special',
      gameOver: 'gameover',
      move: 'move',
    };

    Object.entries(soundFiles).forEach(([key, file]) => {
      const sound = new Sound(file, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log(`Failed to load sound ${file}:`, error);
          sound.release();
          return;
        }
        this.sounds.set(key, sound);
      });
    });
  }

  play(name: string): void {
    if (!this.enabled) return;
    const sound = this.sounds.get(name);
    if (sound) {
      sound.stop();
      sound.play();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  release(): void {
    this.sounds.forEach((sound) => sound.release());
  }
}

export const soundManager = new SoundManager();
