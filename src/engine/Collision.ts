import { Position } from '../utils/constants';

export class Collision {
  static checkFoodCollision(head: Position, food: Position): boolean {
    return head.x === food.x && head.y === food.y;
  }

  static isInMagnetRange(head: Position, food: Position, range: number = 3): boolean {
    const dx = Math.abs(head.x - food.x);
    const dy = Math.abs(head.y - food.y);
    return dx <= range && dy <= range;
  }
}
