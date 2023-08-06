import { makeExponentialBackoffStrategy } from './makeExponentialBackoffStrategy';

// in this case useCallback is just an implementation detail, so mock if
jest.mock('react', () => ({
  useCallback: jest.fn((fn) => fn),
}));

describe('makeSimpleBackoffStrategy', () => {
  it('should make a function that when called returns a exponential sequence up to the max retries multiplied by the default timeoutMultiplier', () => {
    const exponentialBackoffStrategy = makeExponentialBackoffStrategy({ maxRetries: 4 });

    expect(exponentialBackoffStrategy(0)).toBe(400);
    expect(exponentialBackoffStrategy(1)).toBe(800);
    expect(exponentialBackoffStrategy(2)).toBe(1600);
    expect(exponentialBackoffStrategy(3)).toBe(3200);
    expect(exponentialBackoffStrategy(4)).toBe(-1);
    expect(exponentialBackoffStrategy(5)).toBe(-1);
    expect(exponentialBackoffStrategy(6)).toBe(-1);
    expect(exponentialBackoffStrategy(7)).toBe(-1);
    expect(exponentialBackoffStrategy(1000)).toBe(-1);
  });

  it('should make a function that when called returns the passed timeout as many times as the passed number of retries given a high number of maxRetries', () => {
    const exponentialBackoffStrategy = makeExponentialBackoffStrategy({ maxRetries: 10 });

    expect(exponentialBackoffStrategy(0)).toBe(400);
    expect(exponentialBackoffStrategy(1)).toBe(800);
    expect(exponentialBackoffStrategy(2)).toBe(1600);
    expect(exponentialBackoffStrategy(3)).toBe(3200);
    expect(exponentialBackoffStrategy(4)).toBe(6400);
    expect(exponentialBackoffStrategy(5)).toBe(12800);
    expect(exponentialBackoffStrategy(6)).toBe(25600);
    expect(exponentialBackoffStrategy(7)).toBe(51200);
    expect(exponentialBackoffStrategy(8)).toBe(102400);
    expect(exponentialBackoffStrategy(9)).toBe(204800);
    // 10
    expect(exponentialBackoffStrategy(10)).toBe(-1);
    expect(exponentialBackoffStrategy(1000)).toBe(-1);
  });
  it('should make a function that when called returns a exponential sequence up to the max retries multiplied by the passed timeoutMultiplier using the passed base and offset', () => {
    const exponentialBackoffStrategy = makeExponentialBackoffStrategy(
      {
        maxRetries: 10, timeoutMultiplier: 132, base: 10, offset: 1,
      },
    );

    expect(exponentialBackoffStrategy(0)).toBe((10 ** 1) * 132);
    expect(exponentialBackoffStrategy(1)).toBe((10 ** 2) * 132);
    expect(exponentialBackoffStrategy(2)).toBe((10 ** 3) * 132);
    expect(exponentialBackoffStrategy(3)).toBe((10 ** 4) * 132);
    expect(exponentialBackoffStrategy(4)).toBe((10 ** 5) * 132);
    expect(exponentialBackoffStrategy(5)).toBe((10 ** 6) * 132);
    expect(exponentialBackoffStrategy(6)).toBe((10 ** 7) * 132);
    expect(exponentialBackoffStrategy(7)).toBe((10 ** 8) * 132);
    expect(exponentialBackoffStrategy(8)).toBe((10 ** 9) * 132);
    expect(exponentialBackoffStrategy(9)).toBe((10 ** 10) * 132);
    expect(exponentialBackoffStrategy(10)).toBe(-1);
    expect(exponentialBackoffStrategy(11)).toBe(-1);
    expect(exponentialBackoffStrategy(1000)).toBe(-1);
  });
});
