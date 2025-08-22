import { useCallback, useRef } from "react";

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    }) as T,
    [callback, delay],
  );
}

interface ThrottleOptions {
  delay: number;
  leading?: boolean; // Execute on first call
  trailing?: boolean; // Execute on last call
}

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  options: ThrottleOptions,
) => {
  const { delay, leading = true, trailing = true } = options;
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgsRef.current = args;

      // Leading edge execution
      if (leading && now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callback(...args);
        return;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Trailing edge execution
      if (trailing) {
        timeoutRef.current = setTimeout(
          () => {
            lastCallRef.current = Date.now();
            if (lastArgsRef.current) {
              callback(...lastArgsRef.current);
            }
            timeoutRef.current = null;
          },
          delay - (now - lastCallRef.current),
        );
      }
    },
    [callback, delay, leading, trailing],
  );

  // Cleanup function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  return { throttledCallback, cancel };
};
