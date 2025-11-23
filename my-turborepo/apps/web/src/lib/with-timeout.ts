'use client';

/**
 * Thrown when a promise exceeds the provided timeout window.
 */
export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps any promise-like call and rejects if it does not resolve within the allotted time.
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  ms = 15000,
  message = 'Request timed out'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new TimeoutError(message)), ms);
  });

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  }) as Promise<T>;
}


