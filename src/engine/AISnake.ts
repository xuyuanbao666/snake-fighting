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
  private wanderAngle: number;
  private behaviorTimer: number;
  private behavior: 'chase' | 'intercept' | 'wander' | 'flee' = 'wander';

  constructor(name: string, color: string, startX: number, startY: number) {
    this.body = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.velocityX = 1;
    this.velocityY = 0;
    this.speed = 0.13;
    this.color = color;
    this.name = name;
    this.alive = true;
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.behaviorTimer = 0;
  }

  update(foods: Position[], playerHead: Position, playerBody: Position[]): void {
    if (!this.alive) return;

    this.behaviorTimer--;
    if (this.behaviorTimer <= 0) {
      this.decideBehavior(foods, playerHead, playerBody);
      this.behaviorTimer = 15 + Math.floor(Math.random() * 15);
    }

    this.executeBehavior(foods, playerHead, playerBody);
    this.move();
    this.checkBounds();
  }

  private decideBehavior(foods: Position[], playerHead: Position, playerBody: Position[]): void {
    const head = this.body[0];
    const distToPlayer = this.distance(head, playerHead);

    // Find nearest food
    let nearestFood: Position | null = null;
    let minFoodDist = Infinity;
    for (const food of foods) {
      const d = this.distance(head, food);
      if (d < minFoodDist) {
        minFoodDist = d;
        nearestFood = food;
      }
    }

    // Find nearest food to player
    let nearestFoodToPlayer: Position | null = null;
    let minPlayerFoodDist = Infinity;
    for (const food of foods) {
      const d = this.distance(playerHead, food);
      if (d < minPlayerFoodDist) {
        minPlayerFoodDist = d;
        nearestFoodToPlayer = food;
      }
    }

    const rand = Math.random();

    // If close to player, try to intercept or encircle
    if (distToPlayer < 8 && this.body.length > playerBody.length * 0.7) {
      if (rand < 0.5) {
        this.behavior = 'intercept';
      } else if (rand < 0.8) {
        this.behavior = 'chase';
      } else {
        this.behavior = 'wander';
      }
    }
    // If player is heading towards a food, try to抢 it
    else if (nearestFoodToPlayer && minPlayerFoodDist < 10 && this.distance(head, nearestFoodToPlayer) < minPlayerFoodDist + 3) {
      this.behavior = 'chase';
    }
    // If there's food nearby, go get it
    else if (nearestFood && minFoodDist < 15) {
      this.behavior = 'chase';
    }
    // Otherwise wander or try to cut off player
    else if (rand < 0.3 && distToPlayer < 20) {
      this.behavior = 'intercept';
    } else {
      this.behavior = 'wander';
    }
  }

  private executeBehavior(foods: Position[], playerHead: Position, playerBody: Position[]): void {
    const head = this.body[0];

    switch (this.behavior) {
      case 'chase': {
        // Find nearest food
        let nearestFood: Position | null = null;
        let minDist = Infinity;
        for (const food of foods) {
          const d = this.distance(head, food);
          if (d < minDist) {
            minDist = d;
            nearestFood = food;
          }
        }
        if (nearestFood) {
          this.moveTowards(nearestFood);
        }
        break;
      }

      case 'intercept': {
        // Try to get ahead of the player
        const playerVelX = playerBody[0].x - (playerBody[1]?.x ?? playerBody[0].x);
        const playerVelY = playerBody[0].y - (playerBody[1]?.y ?? playerBody[0].y);
        const predictX = playerHead.x + playerVelX * 8;
        const predictY = playerHead.y + playerVelY * 8;
        const target = {
          x: Math.max(2, Math.min(GRID_SIZE - 2, predictX)),
          y: Math.max(2, Math.min(GRID_SIZE - 2, predictY)),
        };
        this.moveTowards(target);
        break;
      }

      case 'flee': {
        // Move away from player
        const dx = head.x - playerHead.x;
        const dy = head.y - playerHead.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.velocityX = dx / dist;
        this.velocityY = dy / dist;
        break;
      }

      case 'wander':
      default: {
        this.wander();
        break;
      }
    }
  }

  private moveTowards(target: Position): void {
    const head = this.body[0];
    const dx = target.x - head.x;
    const dy = target.y - head.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.velocityX = dx / dist;
    this.velocityY = dy / dist;
  }

  private wander(): void {
    const head = this.body[0];

    // Avoid walls
    if (head.x < 4) this.wanderAngle = 0;
    else if (head.x > GRID_SIZE - 4) this.wanderAngle = Math.PI;
    else if (head.y < 4) this.wanderAngle = Math.PI / 2;
    else if (head.y > GRID_SIZE - 4) this.wanderAngle = -Math.PI / 2;
    else {
      this.wanderAngle += (Math.random() - 0.5) * 0.6;
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

  private distance(a: Position, b: Position): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
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
  const names = ['猎手', '拦截者', '围堵者', '抢食者', '暗影'];
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
