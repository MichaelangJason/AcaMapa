export const debounce = <T>(
  fn: (...args: any[]) => Promise<T>,
  delay: number,
) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]): Promise<T> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        const result = await fn(...args);
        resolve(result);
      }, delay);
    });
  };
};
