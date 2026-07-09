import { GRID_SIZE, Position } from '../utils/constants';

export class Snake {
  body: Position[];
  velocityX: number;
  velocityY: number;
  speed: number;

  constructor() {
    this.body = [
      { x: 50, y: 50 },
      { x: 49, y: 50 },
      { x: 48, y: 50 },
      { x: 47, y: 50 },
      { x: 46, y: 50 },
    ];
    this.velocityX = 1;
    this.velocityY = 0;
    this.speed = 0.15;
  }

  setDirectionFromAngle(angle: number): void {
    this.velocityX = Math.cos(angle);
    this.velocityY = Math.sin(angle);
  }

  move(): void {
    const head = this.body[0];
    const newHead = {
      x: head.x + this.velocityX * this.speed,
      y: head.y + this.velocityY * this.speed,
    };
    this.body.unshift(newHead);
    this.body.pop();
  }

  grow(): void {
    const tail = this.body[this.body.length - 1];
    const prev = this.body[this.body.length - 2] || tail;
    this.body.push({
      x: tail.x + (tail.x - prev.x) * 0.5,
      y: tail.y + (tail.y - prev.y) * 0.5,
    });
  }

  checkWallCollision(): boolean {
    const head = this.body[0];
    return head.x < 0.5 || head.x > GRID_SIZE - 0.5 || head.y < 0.5 || head.y > GRID_SIZE - 0.5;
  }

  checkSelfCollision(): boolean {
    return false;
  }

  getHead(): Position {
    return this.body[0];
  }
}
