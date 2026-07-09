export class GameLoop {
  private onUpdate: () => void;
  private speed: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private rafId: number | null = null;
  private lastTime = 0;

  constructor(onUpdate: () => void, speed: number = 150) {
    this.onUpdate = onUpdate;
    this.speed = speed;
  }

  start(): void {
    if (this.intervalId || this.rafId) {
      return;
    }
    this.lastTime = performance.now();
    const loop = (time: number) => {
      if (time - this.lastTime >= this.speed) {
        this.lastTime = time;
        this.onUpdate();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  isRunning(): boolean {
    return this.intervalId !== null || this.rafId !== null;
  }
}
