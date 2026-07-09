import {GameLoop} from './GameLoop';

describe('GameLoop', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start game loop', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate);
    loop.start();
    jest.advanceTimersByTime(150);
    expect(onUpdate).toHaveBeenCalled();
  });

  it('should stop game loop', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate);
    loop.start();
    loop.stop();
    jest.advanceTimersByTime(300);
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('should update at correct speed', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate, 200);
    loop.start();
    jest.advanceTimersByTime(200);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(200);
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it('should change speed', () => {
    const onUpdate = jest.fn();
    const loop = new GameLoop(onUpdate, 200);
    loop.start();
    loop.setSpeed(100);
    jest.advanceTimersByTime(100);
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
