import { GameLoop } from './GameLoop';

describe('GameLoop', () => {
  let callback: ((time: number) => void) | undefined;
  let nextId = 0;
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  beforeEach(() => {
    callback = undefined;
    nextId = 0;
    globalThis.requestAnimationFrame = jest.fn(cb => { callback = cb; return nextId++; });
    globalThis.cancelAnimationFrame = jest.fn(() => { callback = undefined; });
  });
  afterEach(() => {
    globalThis.requestAnimationFrame = originalRequest;
    globalThis.cancelAnimationFrame = originalCancel;
  });
  function frame(time: number) {
    const pending = callback;
    callback = undefined;
    if (pending) pending(time);
  }

  it('updates only after the configured interval', () => {
    const update = jest.fn();
    const loop = new GameLoop(update, 150);
    loop.start();
    frame(0); frame(149);
    expect(update).not.toHaveBeenCalled();
    frame(150); frame(300);
    expect(update).toHaveBeenCalledTimes(2);
    loop.stop();
  });
  it('cancels even a zero-valued frame id', () => {
    const update = jest.fn();
    const loop = new GameLoop(update);
    loop.start();
    loop.stop();
    frame(300);
    expect(update).not.toHaveBeenCalled();
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalledWith(0);
  });
  it('does not restart after a stop inside the update callback', () => {
    const loop = new GameLoop(() => loop.stop(), 16);
    loop.start(); frame(0); frame(16);
    expect(loop.isRunning()).toBe(false);
    expect(callback).toBeUndefined();
  });
  it('does not schedule duplicate loops and accepts speed changes', () => {
    const update = jest.fn();
    const loop = new GameLoop(update, 200);
    loop.start(); loop.start();
    expect(globalThis.requestAnimationFrame).toHaveBeenCalledTimes(1);
    frame(0); loop.setSpeed(100); frame(100);
    expect(update).toHaveBeenCalledTimes(1);
    loop.stop();
  });
});
