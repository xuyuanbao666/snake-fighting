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
    const specialChance = Math.min(0.3, 0.05 + score / 1000);
    if (Math.random() < specialChance) {
      const types = [FoodType.STAR, FoodType.ROCKET, FoodType.SHIELD, FoodType.MAGNET];
      return types[Math.floor(Math.random() * types.length)];
    }
    return FoodType.NORMAL;
  }
}
