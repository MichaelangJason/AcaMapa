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

export const throttle = <T>(
  fn: (...args: any[]) => Promise<T>,
  window: number,
) => {
  let lastExec: number = 0;
  let timeOutId: NodeJS.Timeout | undefined;

  return async (...args: any[]): Promise<T> => {
    const now = Date.now();
    const remainingTime = window - (now - lastExec);

    if (timeOutId) {
      clearTimeout(timeOutId);
      timeOutId = undefined;
    }

    if (remainingTime <= 0) {
      try {
        lastExec = now;
        const result = await fn(...args);
        return result;
      } catch (error) {
        throw error;
      }
    }

    return new Promise((resolve, reject) => {
      timeOutId = setTimeout(async () => {
        try {
          lastExec = now;
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, remainingTime);
    });
  };
};

// should be similar to lodash debounce with maxWait
export const throttledDebounce = <T>(
  fn: (...args: any[]) => Promise<T>,
  debounceDelay: number,
  throttleWindow: number,
) => {
  if (debounceDelay < 0 || throttleWindow < 0) {
    throw new Error("Debounce delay and throttle window must be positive");
  }
  if (debounceDelay > throttleWindow) {
    throw new Error("Debounce delay is longer than throttle window");
  }

  let nextExecDDL: number = 0;
  let lastExec: number = 0;
  let timeOutId: NodeJS.Timeout | undefined;
  let isExecuting = false;

  return async (...args: any[]): Promise<T> => {
    if (isExecuting) {
      throw new Error("Function running time is greater than debounce delay");
    }
    const now = Date.now();
    const timeSinceLastExec = now - lastExec;

    if (timeOutId) {
      clearTimeout(timeOutId);
      timeOutId = undefined;
    }

    let executionTime: number;
    // if enough time has passed, start new deadline window
    if (timeSinceLastExec >= throttleWindow) {
      if (!nextExecDDL) {
        nextExecDDL = now + throttleWindow;
      }
      const debounceTime = now + debounceDelay;
      executionTime = Math.min(debounceTime, nextExecDDL);
      // console.group("sync, with debounce delay");
      // console.log("lastExec", lastExec);
      // console.log("timeSinceLastExec", timeSinceLastExec);
      // console.log("throttleWindow", throttleWindow);
      // console.log("nextExecDDL", nextExecDDL);
      // console.log("now", now);
      // console.log("executionTime", executionTime);
      // console.log("isExecuting", isExecuting);
      console.groupEnd();
    } else {
      // within throttle window, set execution time to be the beginning of the next throttle window
      executionTime = (lastExec === 0 ? now : lastExec) + throttleWindow;
      // console.group("sync, within throttle window");
      // console.log("lastExec", lastExec);
      // console.log("timeSinceLastExec", timeSinceLastExec);
      // console.log("throttleWindow", throttleWindow);
      // console.log("nextExecDDL", nextExecDDL);
      // console.log("now", now);
      // console.log("executionTime", executionTime);
      // console.log("isExecuting", isExecuting);
      // console.groupEnd();
    }

    const remainingTime = executionTime - now;

    if (remainingTime <= 0) {
      console.group("throttledDebounce");
      console.log("remainingTime", remainingTime);
      console.log("nextExecDDL", nextExecDDL);
      console.log("now", now);
      console.log("executionTime", executionTime);
      console.log("isExecuting", isExecuting);
      console.groupEnd();
      throw new Error("Remaining time is negative");
    }

    return new Promise((resolve, reject) => {
      timeOutId = setTimeout(async () => {
        nextExecDDL = 0; // reset deadline
        lastExec = Date.now();
        isExecuting = true;
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          isExecuting = false;
        }
      }, remainingTime);
    });
  };
};
