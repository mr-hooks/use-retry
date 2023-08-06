import { makeFibonacciBackoffStrategy } from './makeFibonacciBackoffStrategy';

// in this case useCallback is just an implementation detail, so mock if
jest.mock('react', () => ({
  useCallback: jest.fn((fn) => fn),
}));

describe('makeSimpleBackoffStrategy', () => {
  it('should make a function that when called returns a fibonacci sequence up to the max retries multiplied by the default timeoutMultiplier', () => {
    const fibonacciBackoffStrategy = makeFibonacciBackoffStrategy({ maxRetries: 4 });

    expect(fibonacciBackoffStrategy(0)).toBe(1000);
    expect(fibonacciBackoffStrategy(1)).toBe(2000);
    expect(fibonacciBackoffStrategy(2)).toBe(3000);
    expect(fibonacciBackoffStrategy(3)).toBe(5000);
    expect(fibonacciBackoffStrategy(4)).toBe(-1);
    expect(fibonacciBackoffStrategy(5)).toBe(-1);
    expect(fibonacciBackoffStrategy(6)).toBe(-1);
    expect(fibonacciBackoffStrategy(7)).toBe(-1);
    expect(fibonacciBackoffStrategy(1000)).toBe(-1);
  });

  it('should make a function that when called returns the passed timeout as many times as the passed number of retries given a very high number of maxRetries', () => {
    const fibonacciBackoffStrategy = makeFibonacciBackoffStrategy({ maxRetries: 30 });

    expect(fibonacciBackoffStrategy(0)).toBe(1000);
    expect(fibonacciBackoffStrategy(1)).toBe(2000);
    expect(fibonacciBackoffStrategy(2)).toBe(3000);
    expect(fibonacciBackoffStrategy(3)).toBe(5000);
    expect(fibonacciBackoffStrategy(4)).toBe(8000);
    expect(fibonacciBackoffStrategy(5)).toBe(13000);
    expect(fibonacciBackoffStrategy(6)).toBe(21000);
    expect(fibonacciBackoffStrategy(7)).toBe(34000);
    expect(fibonacciBackoffStrategy(8)).toBe(55000);
    expect(fibonacciBackoffStrategy(9)).toBe(89000);
    // 10
    expect(fibonacciBackoffStrategy(10)).toBe(144000);
    expect(fibonacciBackoffStrategy(11)).toBe(233000);
    expect(fibonacciBackoffStrategy(12)).toBe(377000);
    expect(fibonacciBackoffStrategy(13)).toBe(610000);
    expect(fibonacciBackoffStrategy(14)).toBe(987000);
    expect(fibonacciBackoffStrategy(15)).toBe(1597000);
    expect(fibonacciBackoffStrategy(16)).toBe(2584000);
    expect(fibonacciBackoffStrategy(17)).toBe(4181000); // end of sequence here
    expect(fibonacciBackoffStrategy(18)).toBe(4181000);
    expect(fibonacciBackoffStrategy(19)).toBe(4181000);
    // 20
    expect(fibonacciBackoffStrategy(20)).toBe(4181000);
    expect(fibonacciBackoffStrategy(21)).toBe(4181000);
    expect(fibonacciBackoffStrategy(22)).toBe(4181000);
    expect(fibonacciBackoffStrategy(23)).toBe(4181000);
    expect(fibonacciBackoffStrategy(24)).toBe(4181000);
    expect(fibonacciBackoffStrategy(25)).toBe(4181000);
    expect(fibonacciBackoffStrategy(26)).toBe(4181000);
    expect(fibonacciBackoffStrategy(27)).toBe(4181000);
    expect(fibonacciBackoffStrategy(28)).toBe(4181000);
    expect(fibonacciBackoffStrategy(29)).toBe(4181000);
    // 30
    expect(fibonacciBackoffStrategy(30)).toBe(-1);
    expect(fibonacciBackoffStrategy(1000)).toBe(-1);
  });
  it('should make a function that when called returns a fibonacci sequence up to the max retries multiplied by the passed timeoutMultiplier', () => {
    const fibonacciBackoffStrategy = makeFibonacciBackoffStrategy(
      { maxRetries: 10, timeoutMultiplier: 132 },
    );

    expect(fibonacciBackoffStrategy(0)).toBe(132);
    expect(fibonacciBackoffStrategy(1)).toBe(2 * 132);
    expect(fibonacciBackoffStrategy(2)).toBe(3 * 132);
    expect(fibonacciBackoffStrategy(3)).toBe(5 * 132);
    expect(fibonacciBackoffStrategy(4)).toBe(8 * 132);
    expect(fibonacciBackoffStrategy(5)).toBe(13 * 132);
    expect(fibonacciBackoffStrategy(6)).toBe(21 * 132);
    expect(fibonacciBackoffStrategy(7)).toBe(34 * 132);
    expect(fibonacciBackoffStrategy(8)).toBe(55 * 132);
    expect(fibonacciBackoffStrategy(9)).toBe(89 * 132);
    expect(fibonacciBackoffStrategy(10)).toBe(-1);
    expect(fibonacciBackoffStrategy(11)).toBe(-1);
    expect(fibonacciBackoffStrategy(1000)).toBe(-1);
  });
});
