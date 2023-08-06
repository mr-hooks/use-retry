![mr-hooks.png](https://raw.githubusercontent.com/mr-hooks/.github/main/mr-hooks.png)

# useRetry

useRetry is a hook that can call a retry function for you in the case that an asyncronous action fails.

Its most common use case is to retry failed data loads in conjunction with data fetching hooks such as `swr`, `use-fetch` and `fetchye`;

useRetry allows you to completely customize your backoff strategy allowing you to be in complete control of how when the retry occurs.


## Usage

This hook can be used alongside any other async operation, be it another hook (such as swr or fetchye), or HOC (such as with redux-thunk or redux-saga).

As long as you can pass to `useRetry` a running, error, and success status, and a function to retry the operation.

### Example with SWR

```typescript jsx
import useRetry, {makeSimpleBackoffStrategy, ABANDONED, BACKOFF} from "@mr-hooks/use-retry";
import useSWRImmutable from "swr/immutable";

const MyDataComponent = () => {
  // use your favourite data hook like normal
  const {data, error, isLoading, mutate} = useSWRImmutable('unreliable.api.com')

  // Pass the loading, error, and success status to useRetry, along with the retry function
  // itself, and optionally a backoff strategy
  const {retryCount, status} = useRetry({
    isFailing: !!error,
    isSucceeded: !!data,
    isRunning: isLoading,
    retry: mutate,
    backoffStrategy: makeSimpleBackoffStrategy(1000, 5)
  })

  // render the status to your application however you see fit
  // you likely dont want to show all statuses to your users
  return (
    <div>
      {isLoading && (
        <p>Loading...</p>
      )}
      {error && (
        <p>{error.message}</p>
      )}
      {status === BACKOFF && (
        <p>Waiting before retry number {retryCount}</p>
      )}
      {status === ABANDONED && (
        <p>Call failed</p>
      )}
      {data && (
        <p>We got data</p>
      )}
    </div>
  );
};

export default MyDataComponent;
```

### Example with Fetchye

```typescript jsx
import useRetry, {makeSimpleBackoffStrategy, ABANDONED, BACKOFF} from "@mr-hooks/use-retry";
import {useFetchye} from 'fetchye';

const MyDataComponent = () => {
  // use your favourite data hook like normal
  const {data, isLoading, error, run} = useFetchye('unreliable.api.com')

  // Pass the loading, error, and success status to useRetry, along with the retry function
  // itself, and optionally a backoff strategy
  const {retryCount, status} = useRetry({
    isFailing: !!error,
    isSucceeded: !!data,
    isRunning: isLoading,
    retry: run,
    backoffStrategy: makeSimpleBackoffStrategy(1000, 5)
  })

  // As previous example
  return <></>;
};

export default MyDataComponent;
```

### Example with Thunk

```typescript jsx
import useRetry, {makeSimpleBackoffStrategy, ABANDONED, BACKOFF} from "@mr-hooks/use-retry";
import { fetchData } from './thunks';

/* Redux state shape:
 * { data: {
 *   'unreliable-api-com': { data: <...>, isLoading: <...>, error: <...> }
 * }}
 */

const MyDataComponent = () => {
  // Hook into the redux store, which is shaped intentionally for use with useRetry
  const {data, isLoading, error} = useSelector((state) => state.data['unreliable-api-com'])
  const dispatch = useDispatch();
  const fetchData = () => dispatch(fetchData('unreliable.api.com'));

  // Pass the loading, error, and success status to useRetry, along with the retry function
  // itself, and optionally a backoff strategy
  const {retryCount, status} = useRetry({
    isFailing: !!error,
    isSucceeded: !!data,
    isRunning: isLoading,
    retry: fetchData,
    backoffStrategy: makeSimpleBackoffStrategy(1000, 5)
  })
  
  // kick off the initial call
  useEffect(() => {
    fetchData()
  }, [])

  // As previous example
  return <></>;
};

export default MyDataComponent;
```

## What is a backoff strategy?

Before we talk about anything else, lets talk about backoff.

Backoff lets you retry less frequently so that retrys don't overload your servers (if you are retrying api calls).

useRetry takes a function 'backoffStrategy' of type `BackoffStrategy = (retryCount : number) => number`

This function is called with how many retries there have been, starting at 0, and should return a number of millisecond that should be waited before retrying the call.

If this function returns a negative number, the call is considered abandoned, and the call will no-longer be called.

This lets you 'build in' the max number of retries to your backoff strategy.

The backoff strategy should be a stable reference, so if you are making them in functions, they should be wrapped in React.useCallback.

### Example

Let's look at the defaut implementation of the backoff strategy, 'makeSimpleBackoffStrategy':

```typescript jsx
import React from 'react';
import { BackoffStrategy } from './common';

export type MakeSimpleBackoffStrategy = (timeout: number, maxRetries: number) => BackoffStrategy;

export const makeSimpleBackoffStrategy : MakeSimpleBackoffStrategy = (timeout, maxRetries) => (
  React.useCallback((retryCount) => (retryCount < maxRetries ? timeout : -1), [])
);
```

As you can see, this backofStrategy maker creates a React.useCallback that wll return a fixed timeout for the first n retries, then -1, thus abandoning the call.

You don't need to make these 'maker' functions yourself, if you just want a hard coded strategy.

Consider this backoff strategy that returns the number of retries in seconds, until 10 have passed:

```typescript jsx
import { BackoffStrategy } from '@mr-hooks/use-retry';

export const linearTenTimesBackoffStrategy : BackoffStrategy = (retryCount) =>
  (retryCount > 10 ? -1 : retryCount * 1000);
```

## Whats with all these statuses?

Next lets look at the statuses useRetry and understand what the lifecycle of useRetry is

### status === IDLE

The first status is IDLE. This is the stating status of useRetry, and will be the status until either isFailing, isSucceeded, or isRunning is true.

### status === SUCCEEDED

The SUCCEEDED status will always be returned if the isSucceeded option is `true` regardless of the other options passed.

In this state, the retry count will also be reset. This means if you start your async operation again, and it _then_ goes into a failed state, the backoff strategy will start again.

### status === RUNNING

RUNNING is the status when isRunning is `true` (and isSucceeded is `false`).

In this state useRetry will do nothing, its waiting for your async operation to either succeed, or fail!

### status === BACKOFF

If isFailing is ever `true` while isRunning and isSucceeded are both `false`, useRetry will begin the retry process.

First if calls the `backoffStrategy` function and gets the backoff duration.

It then increments the retryCount

It then schedules the `retry` function to be called after the backoff duration.

While the `retry` function is waiting to be run, the status will be BACKOFF.

It means 'nothing is happening right now, but the retry is scheduled'.

You might think there would be a status for 'The retry function has been called' but actually, useRetry expects you to once again be passing `isRunning: true` in this case.

useRetry _relies_ on this. You _must_ pass `isRunning: true` while your async operation is running, else useRetry wont be-able to detect when the current retry fails (if it fails for a second time).

### status === ABANDONED

Finally, if isFailing is ever `true` while isRunning and isSucceeded are both `false`, but the `backoffStrategy` function returns a negative number, the status will be set to ABANDONED.

In this case useRetry will _not_ schedule your retry function, meaning that with no other external action, the call is now considered truly failed.

When status is ABANDONED, useRetry will also reset the retryCount. This ensures if your async operation goes `isRunning: true` again (such as if the user presses a button to manually retry) and that call fails, the backoffStrategy will start aagain.

### A nice parcel (Suggested usages)

useRetry takes a few complex options, and returns a few complex options.

Consider creating your own custom hook over useRetry to simlify it somewhat:

#### Set the backoff ahead of time
This option does not reduce the boilerplate much, but would let you have a 'global' backoff strategy
```typescript jsx
// useLinearRetry.tx
const useLinerRetry = (options) => (
  useRetry({
    ...options,
    backoffStrategy: (retryCount) => (retryCount > 10 ? -1 : retryCount * 1000)
  })
)


// MyComponent.tsx excerpt
const {data, isLoading, error, run} = useFetchye('exampleUnreliableUrl.com');

// Pass the loading, error, and success status to useRetry, along with the retry function
// itself, and optionally a backoff strategy
const {retryCount, status} = useLinerRetry({
  isFailing: !!error,
  isSucceeded: !!data,
  isRunning: isLoading,
  retry: run,
})
```

#### Wrap up the hooks together
This option is the recommended usage for large teams where boilerplate reduction is key
```typescript jsx
// useDataWithRetry.tx
const useDataWithRetry = (...params) => {

  const data = useFetchye(...params);

  const retry = useRetry({
    isFailing: !!data.error,
    isSucceeded: !!data.data,
    isRunning: data.isLoading,
    retry: data.run,
    backoffStrategy: (retryCount) => (retryCount > 10 ? -1 : retryCount * 1000)
  })
  
  return {data, retry}
}


// MyComponent.tsx excerpt
const {data: {data, error}, retry: {status}} = useDataWithRetry('exampleUnreliableUrl.com');

```

### API

```typescript jsx
export type BackoffStrategy = (retryCount: number) => number;

export type Status = typeof IDLE
  | typeof BACKOFF
  | typeof ABANDONED
  | typeof SUCCEEDED
  | typeof RUNNING;

export type UseRetry = (options: {
  isFailing: boolean,
  isSucceeded: boolean,
  isRunning: boolean,
  retry: () => any,
  backoffStrategy?: BackoffStrategy
}) => { retryCount: number, status: Status };
```

#### param: isFailing {boolean}
If this input is `true` while isRunning and isSucceeded are `false`, useRetry will begin the retry process

#### param: isSucceeded {boolean}
If this input is ever `true` useRetry will consider the call to have been a success.

useRetry will reset the retryCount, then do nothing

#### param: isRunning {boolean}
If this input is `true` while isSucceeded is `false`, useRetry will consider the async operation to be running, and do nothing

#### param: retry {() => any}
This is the function that will be called after the backoff duration when isFailing is `true`

#### param: backoffStrategy {(retryCount: number) => number | undefined}
This function is called when useRetry wants to schedule the retry function.

It is passed the retry count, and should return either

- A positive integer representing the number of milliseconds to wait before calling the retry function
- Any negative integer, to indicate to useRetry that the current async operation should be abandoned.

The default value for the backoff strategy is constructed as:

```typescript jsx
backoffStrategy = makeSimpleBackoffStrategy(({ timeout: 1000, maxRetries: 5 }))
```

There are two other built in backoff strategies (see below)

#### return: { retryCount: number, status: Status }
Returns the current retry count and the status

Note: the current retryCount is incremented just before the retry function is _schedule_ so it will be +1 during the `BACKOFF` status

### Backoff Strategies

The hook comes with three backoff strategies to help you build meaningful retries out the box

#### makeSimpleBackoffStrategy {( options: { timeout: number, maxRetries: number } ) => BackoffStrategy}
Creates a fixed backoff strategy that waits the same number of milliseconds for a fixed number of retries

After `maxRetries` it will always return -1

#### makeFibonacciBackoffStrategy {( options: { timeoutMultiplier?: number = 1000, maxRetries: number } ) => BackoffStrategy}
Creates a fiboacci backoff strategy that waits an increasing number of ms in accordance with a slightly modifieg fibonacci sequence.

After `maxRetries` it will always return -1

Each number is multiplied by the `timeoutMultiplier` which defaults to `1000` thus producing a sequence of seconds.

This implementation starts at 1, and returns 2 next (skipping the first 0 and 1 in the fibonacci sequence)

This implementation only goes up to `4181`, from then on it repeats that number

This implementation uses a precalculated list of fibonacci numbers for cpu efficiency at the cost of memory

#### MakeExponentialBackoffStrategy {( options: { timeoutMultiplier?: number = 100, base?: number = 2, offset?: number = 2, maxRetries: number } ) => BackoffStrategy}
Creates an exponential backoff strategy that waits an increasing number of ms in accordance with the exponential function ((base ** (retryCount + offset)) * timeoutMultiplier).

After `maxRetries` it will always return -1.

By default, it will produce a power of two sequence in 100's of ms starting with 400ms.

Even with very small bases, this function grows very fast, so take care when you are using it that you dont run into int_max.
