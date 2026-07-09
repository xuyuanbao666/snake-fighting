import { GRID_SIZE, Position } from '../utils/constants';

const AI_COLORS = ['#FF6B6B', '#4ECDC4', '#A8E6CF', '#FFD93D', '#6C5CE7'];

export class AISnake {
  body: Position[];
  velocityX: number;
  velocityY: number;
  speed: number;
  color: string;
  name: string;
  alive: boolean;
  private targetFood: Position | null = null;
  private wanderAngle: number;
  private turnTimer: number;

  constructor(name: string, color: string, startX: number, startY: number) {
    this.body = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.velocityX = 1;
    this.velocityY = 0;
    this.speed = 0.12;
    this.color = color;
    this.name = name;
    this.alive = true;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.turnTimer = 0;
  }

  update(foods: Position[], playerHead: Position): void {
    if (!this.alive) return;

    this.turnTimer--;
    if (this.turnTimer <= 0) {
      this.decideDirection(foods, playerHead);
      this.turnTimer = 10 + Math.floor(Math.random() * 20);
    }

    this.move();
    this.checkBounds();
  }

  private decideDirection(foods: Position[], playerHead: Position): void {
    const head = this.body[0];

    // Find nearest food
    let nearestFood: Position | null = null;
    let minDist = Infinity;
    for (const food of foods) {
      const dx = food.x - head.x;
      const dy = food.y - head.y;
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        nearestFood = food;
      }
    }

    // Decide: chase food or wander
    if (nearestFood && minDist < 400) {
      // Chase food
      const dx = nearestFood.x - head.x;
      const dy = nearestFood.y - head.y;
      this.wanderAngle = Math.atan2(dy, dx);
    } else {
      // Avoid walls
      if (head.x < 5) this.wanderAngle = 0;
      else if (head.x > GRID_SIZE - 5) this.wanderAngle = Math.PI;
      else if (head.y < 5) this.wanderAngle = Math.PI / 2;
      else if (head.y > GRID_SIZE - 5) this.wanderAngle = -Math.PI / 2;
      else {
        // Random wander
        this.wanderAngle += (Math.random() - 0.5) * 0.8;
      }
    }

    this.velocityX = Math.cos(this.wanderAngle);
    this.velocityY = Math.sin(this.wanderAngle);
  }

  private move(): void {
    const head = this.body[0];
    const newHead = {
      x: head.x + this.velocityX * this.speed,
      y: head.y + this.velocityY * this.speed,
    };
    this.body.unshift(newHead);
    this.body.pop();
  }

  private checkBounds(): void {
    const head = this.body[0];
    if (head.x < 1 || head.x > GRID_SIZE - 1 || head.y < 1 || head.y > GRID_SIZE - 1) {
      this.alive = false;
    }
  }

  grow(): void {
    const tail = this.body[this.body.length - 1];
    const prev = this.body[this.body.length - 2] || tail;
    this.body.push({
      x: tail.x + (tail.x - prev.x) * 0.5,
      y: tail.y + (tail.y - prev.y) * 0.5,
    });
  }

  getHead(): Position {
    return this.body[0];
  }

  getLength(): number {
    return this.body.length;
  }
}

export function createAISnakes(count: number): AISnake[] {
  const names = ['小绿', '闪电', '风火轮', '小蓝', '紫霞'];
  const snakes: AISnake[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const dist = 12;
    const x = GRID_SIZE / 2 + Math.cos(angle) * dist;
    const y = GRID_SIZE / 2 + Math.sin(angle) * dist;
    snakes.push(new AISnake(names[i] || `AI${i}`, AI_COLORS[i % AI_COLORS.length], x, y));
  }
  return snakes;
}
