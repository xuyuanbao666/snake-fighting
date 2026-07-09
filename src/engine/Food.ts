import { FoodType, GRID_SIZE, Position } from '../utils/constants';

export class Food {
  generate(snakeBody: Position[]): Position {
    const available: Position[] = [];
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      for (let y = 1; y < GRID_SIZE - 1; y++) {
        const isOccupied = snakeBody.some(
          segment => segment.x === x && segment.y === y
        );
        if (!isOccupied) {
          available.push({ x, y });
        }
      }
    }
    if (available.length === 0) {
      throw new Error('No available positions for food');
    }
    return available[Math.floor(Math.random() * available.length)];
  }

  getRandomType(score: number): FoodType {
    // Higher score = higher chance for better food
    const rand = Math.random();
    const scoreBonus = Math.min(0.3, score / 500);

    // Diamond: 5% base + up to 15% from score
    if (rand < 0.05 + scoreBonus * 0.5) {
      return FoodType.DIAMOND;
    }
    // Apple: 15% base + up to 15% from score
    if (rand < 0.20 + scoreBonus) {
      return FoodType.APPLE;
    }
    // Star: rest
    return FoodType.STAR;
  }
}
