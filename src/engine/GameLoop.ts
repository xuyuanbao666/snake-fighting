export class GameLoop {
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private running = false;

  constructor(private onUpdate: () => void, private speed: number = 150) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = null;
    const loop = (time: number) => {
      if (!this.running) return;
      this.rafId = null;
      if (this.lastTime === null) this.lastTime = time;
      if (time - this.lastTime >= this.speed) {
        this.lastTime = time;
        this.onUpdate();
      }
      if (this.running && this.rafId === null) {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.lastTime = null;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  isRunning(): boolean {
    return this.running;
  }
}
