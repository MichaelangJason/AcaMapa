/* eslint-disable @typescript-eslint/no-unsafe-function-type */

export const debounce = (fn: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: unknown, ...args: unknown[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
};

export const throttle = (fn: Function, delay: number) => {
  let lastTime = 0;
  return function (this: unknown, ...args: unknown[]) {
    const now = new Date().getTime();
    if (now - lastTime < delay) return;
    lastTime = now;
    fn.apply(this, args);
  };
};
