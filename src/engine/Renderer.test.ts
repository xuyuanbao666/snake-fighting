import { Renderer } from './Renderer';
import { FoodType } from '../utils/constants';

describe('Renderer', () => {
  let canvas: any;
  let ctx: any;

  beforeEach(() => {
    ctx = {
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 50 })),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      globalAlpha: 1,
      fillStyle: '',
    };
    canvas = {
      getContext: jest.fn(() => ctx),
      width: 320,
      height: 320,
    };
  });

  it('should initialize with canvas', () => {
    const renderer = new Renderer(canvas);
    expect(renderer).toBeDefined();
  });

  it('should draw snake segment', () => {
    const renderer = new Renderer(canvas);
    renderer.drawSnakeSegment(10, 10, '#4CAF50');
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('should draw star food', () => {
    const renderer = new Renderer(canvas);
    renderer.drawFood(5, 5, FoodType.STAR);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('should draw apple food', () => {
    const renderer = new Renderer(canvas);
    renderer.drawFood(5, 5, FoodType.APPLE);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('should draw diamond food', () => {
    const renderer = new Renderer(canvas);
    renderer.drawFood(5, 5, FoodType.DIAMOND);
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('should clear canvas', () => {
    const renderer = new Renderer(canvas);
    renderer.clear();
    expect(ctx.clearRect).toHaveBeenCalled();
  });

  it('should set theme', () => {
    const renderer = new Renderer(canvas);
    renderer.setTheme('beach');
    renderer.clear();
    expect(ctx.fillStyle).toBe('#FFF8E1');
  });

  it('should draw snake body with alpha gradient', () => {
    const renderer = new Renderer(canvas);
    const body = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    renderer.drawSnakeBody(body, 'classic');
    expect(ctx.fillRect).toHaveBeenCalledTimes(3);
  });

  it('should draw snake head as circle', () => {
    const renderer = new Renderer(canvas);
    renderer.drawSnakeHead(10, 10, 'classic');
    expect(ctx.arc).toHaveBeenCalled();
  });
});
