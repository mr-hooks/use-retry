import { useEffect, useRef } from 'react';
import { makeSimpleBackoffStrategy, BackoffStrategy } from './backoffStrategies';

export const IDLE = Symbol('status: Idle');
export const BACKOFF = Symbol('status: Backoff');
export const ABANDONED = Symbol('status: Abandoned');
export const SUCCEEDED = Symbol('status: Succeeded');
export const RUNNING = Symbol('status: Running');

export type Status = typeof IDLE
  | typeof BACKOFF
  | typeof ABANDONED
  | typeof SUCCEEDED
  | typeof RUNNING;

export type Retry = () => any;

export type UseRetry = (options: {
  isFailing: boolean,
  isSucceeded: boolean,
  isRunning: boolean,
  retry: Retry,
  backoffStrategy?: BackoffStrategy
}) => { retryCount: number, status: Status };

/**
 * useRetry acts like useState, but keeps the url in sync.
 */
const useRetry : UseRetry = ({
  isFailing,
  isSucceeded,
  isRunning,
  retry,
  backoffStrategy = makeSimpleBackoffStrategy({ timeout: 1000, maxRetries: 5 }),
}) => {
  // Use refs so that this hook never causes re-renders
  const retryCountRef = useRef(0);
  const statusRef = useRef<Status>(IDLE);

  // if this hook in unmounted while the retry is queued,
  // it will call a function that is no-longer 'valid'
  // so we MUST cancel that timeout
  const timeoutHandle = useRef<NodeJS.Timeout | undefined>(undefined);

  if (isSucceeded) {
    // The caller is telling us that the call has succeeded, reset and do nothing
    retryCountRef.current = 0;
    statusRef.current = SUCCEEDED;
  } else if (isRunning) {
    // While the caller is loading, we also dont need to do anything
    statusRef.current = RUNNING;
  } else if (isFailing && statusRef.current !== BACKOFF && statusRef.current !== ABANDONED) {
    // The call has failed, and we are not already retrying,
    // check the backoff strategy then queue up the retry
    const nextTimeout = backoffStrategy(retryCountRef.current);
    if (nextTimeout >= 0) {
      retryCountRef.current += 1;
      statusRef.current = BACKOFF;
      timeoutHandle.current = setTimeout(() => {
        timeoutHandle.current = undefined;
        retry();
      }, nextTimeout);
    } else {
      statusRef.current = ABANDONED;
      // Also reset the retry count, so that if the call goes loading again,
      // the backoff strategy is reset
      retryCountRef.current = 0;
    }
  }

  // clear the timeout on unmount if its running
  useEffect(() => () => {
    if (timeoutHandle.current !== undefined) {
      clearTimeout(timeoutHandle.current);
    }
  }, []);

  return { retryCount: retryCountRef.current, status: statusRef.current };
};

export default useRetry;
