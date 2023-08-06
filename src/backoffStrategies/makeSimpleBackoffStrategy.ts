import React from 'react';
import { BackoffStrategy } from './common';

export type MakeSimpleBackoffStrategy = (
  options: { timeout: number, maxRetries: number }
) => BackoffStrategy;

/**
 * makeSimpleBackoffStrategy will make a backoff strategy that returns the passed time out for
 *   the passed number of retries
 * @param {number} timeout - the number of ms to be returned for each backoff
 * @param {number} maxRetries - the maximum number of times to retry before abandoning the retry
 */
export const makeSimpleBackoffStrategy : MakeSimpleBackoffStrategy = ({ timeout, maxRetries }) => (
  React.useCallback((retryCount) => (retryCount < maxRetries ? timeout : -1), [])
);
