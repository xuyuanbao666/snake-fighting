import { Snake } from './Snake';
import { Direction, GRID_SIZE } from '../utils/constants';

describe('Snake', () => {
  let snake: Snake;

  beforeEach(() => {
    snake = new Snake();
  });

  it('should initialize with correct length', () => {
    expect(snake.body.length).toBe(3);
  });

  it('should move right by default', () => {
    const initialHead = { ...snake.body[0] };
    snake.move();
    expect(snake.body[0].x).toBe(initialHead.x + 1);
    expect(snake.body[0].y).toBe(initialHead.y);
  });

  it('should change direction', () => {
    snake.setDirection(Direction.DOWN);
    snake.move();
    expect(snake.body[0].y).toBe(11);
  });

  it('should not reverse direction', () => {
    snake.setDirection(Direction.LEFT);
    expect(snake.direction).toBe(Direction.RIGHT);
  });

  it('should grow when eating', () => {
    snake.grow();
    expect(snake.body.length).toBe(4);
  });

  it('should detect wall collision', () => {
    snake.body[0] = { x: 0, y: 0 };
    snake.setDirection(Direction.UP);
    snake.move();
    expect(snake.checkWallCollision()).toBe(true);
  });

  it('should detect self collision', () => {
    snake.body = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ];
    expect(snake.checkSelfCollision()).toBe(true);
  });
});
