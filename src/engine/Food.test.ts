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
    const snakeBody: Position[] = Array.from({ length: 400 }, (_, i) => ({
      x: i % GRID_SIZE,
      y: Math.floor(i / GRID_SIZE),
    }));
    expect(() => food.generate(snakeBody)).toThrow();
  });

  it('should generate special food with probability', () => {
    const types: FoodType[] = [];
    for (let i = 0; i < 100; i++) {
      types.push(food.getRandomType(100));
    }
    expect(types).toContain(FoodType.STAR);
  });

  it('should increase special food chance with score', () => {
    const lowScoreTypes: FoodType[] = [];
    const highScoreTypes: FoodType[] = [];

    for (let i = 0; i < 100; i++) {
      lowScoreTypes.push(food.getRandomType(0));
      highScoreTypes.push(food.getRandomType(500));
    }

    const lowSpecial = lowScoreTypes.filter(t => t !== FoodType.NORMAL).length;
    const highSpecial = highScoreTypes.filter(t => t !== FoodType.NORMAL).length;
    expect(highSpecial).toBeGreaterThanOrEqual(lowSpecial);
  });
});
