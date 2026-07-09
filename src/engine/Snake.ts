import { GRID_SIZE, Position } from '../utils/constants';

export class Snake {
  body: Position[];
  velocityX: number;
  velocityY: number;

  constructor() {
    this.body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    this.velocityX = 1;
    this.velocityY = 0;
  }

  setDirectionFromAngle(angle: number): void {
    const vx = Math.cos(angle);
    const vy = Math.sin(angle);
    const mag = Math.sqrt(vx * vx + vy * vy);
    if (mag < 0.001) return;

    const nvx = vx / mag;
    const nvy = vy / mag;

    if (Math.abs(nvx) > Math.abs(nvy)) {
      this.velocityX = nvx > 0 ? 1 : -1;
      this.velocityY = 0;
    } else {
      this.velocityX = 0;
      this.velocityY = nvy > 0 ? 1 : -1;
    }
  }

  move(): void {
    const head = { ...this.body[0] };
    head.x += this.velocityX;
    head.y += this.velocityY;
    head.x = Math.round(head.x);
    head.y = Math.round(head.y);
    this.body.unshift(head);
    this.body.pop();
  }

  grow(): void {
    const tail = this.body[this.body.length - 1];
    this.body.push({ ...tail });
  }

  checkWallCollision(): boolean {
    const head = this.body[0];
    return head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
  }

  checkSelfCollision(): boolean {
    const seen = new Set<string>();
    for (const seg of this.body) {
      const key = `${seg.x},${seg.y}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }

  getHead(): Position {
    return this.body[0];
  }
}
