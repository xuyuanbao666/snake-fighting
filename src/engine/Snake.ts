import { Direction, GRID_SIZE, Position } from '../utils/constants';

export class Snake {
  body: Position[];
  direction: Direction;

  constructor() {
    this.body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    this.direction = Direction.RIGHT;
  }

  setDirection(newDirection: Direction): void {
    const opposites: Record<Direction, Direction> = {
      [Direction.UP]: Direction.DOWN,
      [Direction.DOWN]: Direction.UP,
      [Direction.LEFT]: Direction.RIGHT,
      [Direction.RIGHT]: Direction.LEFT,
    };
    if (newDirection !== opposites[this.direction]) {
      this.direction = newDirection;
    }
  }

  move(): void {
    const head = { ...this.body[0] };
    switch (this.direction) {
      case Direction.UP: head.y--; break;
      case Direction.DOWN: head.y++; break;
      case Direction.LEFT: head.x--; break;
      case Direction.RIGHT: head.x++; break;
    }
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
    const head = this.body[0];
    if (this.body.slice(1).some(s => s.x === head.x && s.y === head.y)) {
      return true;
    }
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
