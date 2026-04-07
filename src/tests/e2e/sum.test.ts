import { expect, test } from "@jest/globals";

const sum = (...nums: number[]) => nums.reduce((acc, num) => acc + num, 0);

test("sum", () => {
  expect(sum(1, 2, 3, 4, 5)).toBe(15);
});
