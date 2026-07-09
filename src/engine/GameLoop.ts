export class GameLoop {
  private onUpdate: () => void;
  private speed: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(onUpdate: () => void, speed: number = 150) {
    this.onUpdate = onUpdate;
    this.speed = speed;
  }

  start(): void {
    if (this.intervalId) {
      return;
    }
    this.intervalId = setInterval(() => {
      this.onUpdate();
    }, this.speed);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.onUpdate();
      }, this.speed);
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
