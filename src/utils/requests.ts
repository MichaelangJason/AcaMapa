/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import { Course } from "@/types/course";

export const debounce = <T>(fn: (...args: any[]) => Promise<T>, delay: number) => {
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

export const throttle = (fn: Function, delay: number) => {
  let lastTime = 0;
  return function (this: unknown, ...args: unknown[]) {
    const now = new Date().getTime();
    if (now - lastTime < delay) return;
    lastTime = now;
    fn.apply(this, args);
  };
};

export const getCourse = async (courseId: string) => {
  if (!courseId) return null;
  const response = await fetch(`/api/courses/${courseId}`);
  if (!response.ok) return null;
  const data = await response.json();
  console.log(data);
  const { id, name, credits, processed } = data;
  const { prerequisite, restriction, corequisite, note } = processed;
  return { id, name, credits, prerequisites: prerequisite, antirequisites: restriction, corequisites: corequisite, notes: note } as Course;
}