import React from 'react';
import { BackoffStrategy } from './common';

export type MakeFibonacciBackoffStrategy = (
  options: { timeoutMultiplier?: number, maxRetries: number }
) => BackoffStrategy;

const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181];
const maxFib = fib.length;

/**
 * makeFibonacciBackoffStrategy will make a backoff strategy that returns a fibonacci sequence.
 *   The sequence will be multiplied the passed `timeoutMultiplier`, allowing you to scale the
 *   backoff by some number.
 *   This implementation only goes up to `4181`, from then on it repeats that number
 *   This implementation uses a precalculated list of
 *     fibonacci numbers for cpu efficiency at the cost of memory
 * @param {number} timeoutMultiplier [timeoutMultiplier=1000] - The multiplier to the fibonacci
 *   sequence, defaults to `1000` resulting in a fibonacci sequence in seconds
 * @param {number} maxRetries - the maximum number of times to retry before abandoning the retry
 */
export const makeFibonacciBackoffStrategy : MakeFibonacciBackoffStrategy = (
  { maxRetries, timeoutMultiplier = 1000 },
) => (
  React.useCallback((retryCount) => {
    if (retryCount < maxRetries) {
      if (retryCount < maxFib) {
        return fib[retryCount] * timeoutMultiplier;
      }

      // once we are out of pre-calculated numbers, just use the last one
      // using the default timeoutMultiplier this is already over 1 hour
      return fib[maxFib - 1] * timeoutMultiplier;
    }
    return -1;
  }, [])
);
