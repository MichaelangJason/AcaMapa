import { expect, test } from '@jest/globals'; 

const sum = (a: number, b: number) => a + b;

test('sum', () => {
  expect(sum(1, 2)).toBe(3);
});
