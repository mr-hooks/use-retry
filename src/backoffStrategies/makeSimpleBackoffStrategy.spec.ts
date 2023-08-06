import { makeSimpleBackoffStrategy } from './makeSimpleBackoffStrategy';

// in this case useCallback is just an implementation detail, so mock if
jest.mock('react', () => ({
  useCallback: jest.fn((fn) => fn),
}));

describe('makeSimpleBackoffStrategy', () => {
  it('should make a function that when called returns the passed timeout as many times as the passed number of retries', () => {
    const simpleBackoffStrategy = makeSimpleBackoffStrategy({ timeout: 1000, maxRetries: 4 });

    // is this a rigorous test?
    //  The function will only be called with 0 or positive integers
    //  We are assuming that above 7 nothing odd happens,
    //    but we cant exactly call the function with every int, can we?
    expect(simpleBackoffStrategy(0)).toBe(1000);
    expect(simpleBackoffStrategy(1)).toBe(1000);
    expect(simpleBackoffStrategy(2)).toBe(1000);
    expect(simpleBackoffStrategy(3)).toBe(1000);
    expect(simpleBackoffStrategy(4)).toBe(-1);
    expect(simpleBackoffStrategy(5)).toBe(-1);
    expect(simpleBackoffStrategy(6)).toBe(-1);
    expect(simpleBackoffStrategy(7)).toBe(-1);
    expect(simpleBackoffStrategy(1000)).toBe(-1);
  });
});
