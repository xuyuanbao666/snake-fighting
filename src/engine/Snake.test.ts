import { Snake } from './Snake';
import { GRID_SIZE } from '../utils/constants';

describe('Snake', () => {
  let snake: Snake;
  beforeEach(() => { snake = new Snake(); });

  it('initializes a five-segment snake', () => {
    expect(snake.body).toHaveLength(5);
  });

  it('moves continuously at its configured speed', () => {
    const head = { ...snake.getHead() };
    snake.move();
    expect(snake.getHead().x).toBeCloseTo(head.x + snake.speed);
    expect(snake.getHead().y).toBeCloseTo(head.y);
    expect(snake.body).toHaveLength(5);
  });

  it('turns using joystick angles', () => {
    const head = { ...snake.getHead() };
    snake.setDirectionFromAngle(Math.PI / 2);
    snake.move();
    expect(snake.getHead().x).toBeCloseTo(head.x);
    expect(snake.getHead().y).toBeCloseTo(head.y + snake.speed);
  });

  it('grows by one segment', () => {
    snake.grow();
    expect(snake.body).toHaveLength(6);
  });

  it('detects all four wall boundaries', () => {
    for (const head of [{ x: 0, y: 50 }, { x: GRID_SIZE, y: 50 }, { x: 50, y: 0 }, { x: 50, y: GRID_SIZE }]) {
      snake.body[0] = head;
      expect(snake.checkWallCollision()).toBe(true);
    }
    snake.body[0] = { x: 50, y: 50 };
    expect(snake.checkWallCollision()).toBe(false);
  });

  it('permits self overlap in the continuous slither rules', () => {
    snake.body = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }];
    expect(snake.checkSelfCollision()).toBe(false);
  });
});
