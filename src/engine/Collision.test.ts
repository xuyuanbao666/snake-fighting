import { Collision } from './Collision';
import { Position, FoodType } from '../utils/constants';

describe('Collision', () => {
  it('should detect food collision', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 5, y: 5 };
    expect(Collision.checkFoodCollision(head, food)).toBe(true);
  });

  it('should not detect food collision when apart', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 6, y: 5 };
    expect(Collision.checkFoodCollision(head, food)).toBe(false);
  });

  it('should detect magnet attraction', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 7, y: 5 };
    expect(Collision.isInMagnetRange(head, food)).toBe(true);
  });

  it('should not detect magnet attraction when far', () => {
    const head: Position = { x: 5, y: 5 };
    const food: Position = { x: 10, y: 10 };
    expect(Collision.isInMagnetRange(head, food)).toBe(false);
  });
});
