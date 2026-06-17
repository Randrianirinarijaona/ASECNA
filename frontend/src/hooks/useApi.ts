import { useCallback, useEffect, useRef, useState } from 'react';

interface UseApiState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => void;
  reset: () => void;
}

/**
 * Generic hook for data fetching with automatic loading/error handling.
 * Pass a memoized fetcher function to avoid infinite loops.
 */
export function useApi<T>(
  fetcher: (() => Promise<T>) | null,
  deps: unknown[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    isLoading: !!fetcher,
    error: null,
  });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [trigger, setTrigger] = useState(0);

  const execute = useCallback(async () => {
    if (!fetcherRef.current) return;
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      setState({ data, isLoading: false, error: null });
    } catch (err) {
      setState({ data: null, isLoading: false, error: (err as Error).message });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...deps]);

  useEffect(() => {
    execute();
  }, [execute]);

  const refetch = useCallback(() => setTrigger((n) => n + 1), []);
  const reset = useCallback(() =>
    setState({ data: null, isLoading: false, error: null }), []);

  return { ...state, refetch, reset };
}

/**
 * Hook for mutations (POST/PATCH/DELETE) with manual execution.
 */
export function useMutation<TArgs, TResult = unknown>(
  mutator: (args: TArgs) => Promise<TResult>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (args: TArgs): Promise<TResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await mutator(args);
        return result;
      } catch (err) {
        setError((err as Error).message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [mutator]
  );

  return { execute, isLoading, error, clearError: () => setError(null) };
}