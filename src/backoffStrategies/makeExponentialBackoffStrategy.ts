import React from 'react';
import { BackoffStrategy } from './common';

export type MakeExponentialBackoffStrategy = (
  options: { timeoutMultiplier?: number, base?: number, offset?: number, maxRetries: number }
) => BackoffStrategy;

/**
 * makeExponentialBackoffStrategy will make a backoff strategy that performs the `base`
 *   to the power of the (retryCount + offset), then multiplied by the timeoutMultiplier
 *   until maxRetries is met.
 *   By default, it will produce powers of 2 in hundreds of ms starting at 400ms
 *   Note: Even with very small bases, this function grows very fast.
 * @param {number} base [base=2] - the base of the exponent
 * @param {number} offset [offset=2] - the offset added to `retryCount`
 *   ensuring the first value is not `1`
 * @param {number} timeoutMultiplier [timeoutMultiplier=100] - The multiplier to the exponential
 *   sequence, defaults to `100` resulting in an exponential sequence in hundreds of ms
 * @param {number} maxRetries - the maximum number of times to retry before abandoning the retry
 */
export const makeExponentialBackoffStrategy : MakeExponentialBackoffStrategy = (
  {
    maxRetries, base = 2, offset = 2, timeoutMultiplier = 100,
  },
) => (
  React.useCallback((retryCount) => (
    retryCount < maxRetries ? (base ** (retryCount + offset)) * timeoutMultiplier : -1
  ), [])
);
