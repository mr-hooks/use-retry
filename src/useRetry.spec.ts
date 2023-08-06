import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import useRetry, {
  ABANDONED,
  BACKOFF,
  IDLE, Retry, RUNNING, SUCCEEDED,
} from './useRetry';
import { BackoffStrategy } from './backoffStrategies';

const makeControllableTestHook = (
  retry: Retry,
  backoffStrategy : BackoffStrategy | undefined = undefined,
) => () => {
  const [isFailing, setIsFailing] = useState(false);
  const [isSucceeded, setIsSucceeded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const result = useRetry({
    isFailing, isSucceeded, isRunning, retry, backoffStrategy,
  });

  return {
    setIsRunning,
    setIsSucceeded,
    setIsFailing,
    result,
  };
};

describe('useRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  it('should return the IDLE status if called with all false values', () => {
    const { result } = renderHook(makeControllableTestHook(() => {}));

    expect(result.current.result.status).toBe(IDLE);
  });

  it('should return the RUNNING status if the isRunning input goes `true`', () => {
    const { result } = renderHook(makeControllableTestHook(() => {}));

    act(() => {
      result.current.setIsRunning(true);
    });

    expect(result.current.result.status).toBe(RUNNING);
  });

  it('should return the SUCCEEDED status if the isSuccessful input goes `true`', () => {
    const { result } = renderHook(makeControllableTestHook(() => {}));

    act(() => {
      result.current.setIsSucceeded(true);
    });

    expect(result.current.result.status).toBe(SUCCEEDED);
  });

  it('should return the SUCCEEDED status if the isSuccessful and isRunning input goes `true`', () => {
    const { result } = renderHook(makeControllableTestHook(() => {}));

    act(() => {
      result.current.setIsRunning(true);
      result.current.setIsSucceeded(true);
    });

    expect(result.current.result.status).toBe(SUCCEEDED);
  });

  it('should call the backoff function to determine the next wait time, before scheduling the retry function, and end up abandoned', () => {
    const retryMock = jest.fn();
    const backoffStrategyMock = jest.fn().mockImplementationOnce(
      () => 1000, // first wait 1 second
    ).mockImplementationOnce(
      () => -1, // next abandon the call
    );

    const { result } = renderHook(makeControllableTestHook(retryMock, backoffStrategyMock));

    // Its mandatory that the retry function set the system to isRunning again
    retryMock.mockImplementation(() => {
      act(() => {
        result.current.setIsFailing(false);
        result.current.setIsRunning(true);
      });
    });

    // The call has failed
    act(() => {
      result.current.setIsFailing(true);
    });

    expect(result.current.result.status).toBe(BACKOFF);
    expect(result.current.result.retryCount).toBe(1);

    // no retry call yet, we are in backoff
    expect(retryMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    // no retry call yet, since the hook is obeying the `1000`ms in the backoff strategy
    expect(retryMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.result.status).toBe(RUNNING);
    expect(result.current.result.retryCount).toBe(1);

    // Now retry has been called
    expect(retryMock).toHaveBeenCalledTimes(1);

    // The call has failed a second time
    act(() => {
      result.current.setIsFailing(true);
      result.current.setIsRunning(false);
    });

    expect(result.current.result.status).toBe(ABANDONED);
    // Retry count has been reset
    expect(result.current.result.retryCount).toBe(0);

    // No additional call to retry
    expect(retryMock).toHaveBeenCalledTimes(1);

    // Make sure nothing was queued
    act(() => {
      jest.runAllTimers();
    });

    // Still No additional call to retry
    expect(retryMock).toHaveBeenCalledTimes(1);
  });

  it('should call the backoff function to determine the next wait time, before scheduling the retry function, and end up succeeded if the second call succeds', () => {
    const retryMock = jest.fn();
    const backoffStrategyMock = jest.fn().mockImplementationOnce(
      () => 1000, // first wait 1 second
    ).mockImplementationOnce(
      () => -1, // next abandon the call
    );

    const { result } = renderHook(makeControllableTestHook(retryMock, backoffStrategyMock));

    // Its mandatory that the retry function set the system to isRunning again
    retryMock.mockImplementation(() => {
      act(() => {
        result.current.setIsFailing(false);
        result.current.setIsRunning(true);
      });
    });

    // The call has failed
    act(() => {
      result.current.setIsFailing(true);
    });

    expect(result.current.result.status).toBe(BACKOFF);
    expect(result.current.result.retryCount).toBe(1);

    // no retry call yet, we are in backoff
    expect(retryMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    // no retry call yet, since the hook is obeying the `1000`ms in the backoff strategy
    expect(retryMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current.result.status).toBe(RUNNING);
    expect(result.current.result.retryCount).toBe(1);

    // Now retry has been called
    expect(retryMock).toHaveBeenCalledTimes(1);

    // The call has succeeded the second time
    act(() => {
      result.current.setIsSucceeded(true);
      result.current.setIsRunning(false);
    });

    expect(result.current.result.status).toBe(SUCCEEDED);
    // Retry count has been reset
    expect(result.current.result.retryCount).toBe(0);

    // No additional call to retry
    expect(retryMock).toHaveBeenCalledTimes(1);

    // Make sure nothing was queued
    act(() => {
      jest.runAllTimers();
    });

    // Still No additional call to retry
    expect(retryMock).toHaveBeenCalledTimes(1);
  });

  it('should cancel the running timer if the hook is unmounted', () => {
    jest.useRealTimers();
    jest.useFakeTimers({
      legacyFakeTimers: true,
    });
    const retryMock = jest.fn();
    const backoffStrategyMock = jest.fn().mockImplementationOnce(
      () => 1000, // first wait 1 second
    ).mockImplementationOnce(
      () => -1, // next abandon the call
    );

    const renderedHook = renderHook(makeControllableTestHook(retryMock, backoffStrategyMock));
    const { result } = renderedHook;
    // Its mandatory that the retry function set the system to isRunning again
    retryMock.mockImplementation(() => {
      act(() => {
        result.current.setIsFailing(false);
        result.current.setIsRunning(true);
      });
    });

    // The call has failed
    act(() => {
      result.current.setIsFailing(true);
    });

    expect(result.current.result.status).toBe(BACKOFF);
    expect(result.current.result.retryCount).toBe(1);

    // no retry call yet, we are in backoff
    expect(retryMock).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // no retry call yet, since the hook is obeying the `1000`ms in the backoff strategy
    expect(retryMock).not.toHaveBeenCalled();

    expect(clearTimeout).not.toHaveBeenCalled();

    renderedHook.unmount();

    expect(clearTimeout).toHaveBeenCalledTimes(1);
    // @ts-ignore -- we have installed legacy fake timers, so the .mock on setTimeout does exist
    expect(clearTimeout).toHaveBeenNthCalledWith(1, setTimeout.mock.results[0].value);
  });
});
