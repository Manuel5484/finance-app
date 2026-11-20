import { useCallback, useEffect, useState } from 'react';

export type AsyncStatus = 'loading' | 'success' | 'error';

export interface AsyncResult<T> {
  status: AsyncStatus;
  data?: T;
  error?: Error;
  reload: () => void;
}

interface Settled<T> {
  load: () => Promise<T>;
  attempt: number;
  data?: T;
  error?: Error;
}

/** Runs `load` whenever it changes (memoize it with useCallback) or `reload` is called. */
export function useAsyncData<T>(load: () => Promise<T>): AsyncResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => !cancelled && setSettled({ load, attempt, data }),
      (error: unknown) =>
        !cancelled &&
        setSettled({ load, attempt, error: error instanceof Error ? error : new Error(String(error)) }),
    );
    return () => {
      cancelled = true;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((a) => a + 1), []);
  const current = settled && settled.load === load && settled.attempt === attempt ? settled : null;

  if (!current) return { status: 'loading', reload };
  if (current.error) return { status: 'error', error: current.error, reload };
  return { status: 'success', data: current.data, reload };
}
