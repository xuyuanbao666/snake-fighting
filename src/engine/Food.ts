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
    const rand = Math.random();
    const scoreBonus = Math.min(0.2, score / 1000);

    // Diamond: 3% base + up to 10% from score (rarest)
    if (rand < 0.03 + scoreBonus * 0.5) {
      return FoodType.DIAMOND;
    }
    // Apple: 12% base + up to 10% from score (medium)
    if (rand < 0.15 + scoreBonus) {
      return FoodType.APPLE;
    }
    // Star: 85% base (most common)
    return FoodType.STAR;
  }
}
