import { Food } from './Food';
import { FoodType, GRID_SIZE, Position } from '../utils/constants';

describe('Food', () => {
  let food: Food;

  beforeEach(() => {
    food = new Food();
  });

  it('should generate food at random position', () => {
    const pos = food.generate([]);
    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.x).toBeLessThan(GRID_SIZE);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeLessThan(GRID_SIZE);
  });

  it('should not generate food on snake body', () => {
    const snakeBody: Position[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({
      x: i % GRID_SIZE,
      y: Math.floor(i / GRID_SIZE),
    }));
    expect(() => food.generate(snakeBody)).toThrow();
  });

  it('should generate special food with probability', () => {
    const random = jest.spyOn(Math, 'random');
    try {
      random.mockReturnValue(0.01);
      expect(food.getRandomType(0)).toBe(FoodType.DIAMOND);
      random.mockReturnValue(0.1);
      expect(food.getRandomType(0)).toBe(FoodType.APPLE);
      random.mockReturnValue(0.9);
      expect(food.getRandomType(0)).toBe(FoodType.STAR);
    } finally { random.mockRestore(); }
  });

  it('should increase special food chance with score', () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.2);
    try {
      expect(food.getRandomType(0)).toBe(FoodType.STAR);
      expect(food.getRandomType(500)).toBe(FoodType.APPLE);
    } finally { random.mockRestore(); }
  });
});
