export type ReplaceFields<T, From, To> = {
  [K in keyof T]: T[K] extends From ? To : T[K];
};

export type NonNullableRequired<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

import type { Types } from "mongoose";
export type ReplaceObjectId<T> = {
  [K in keyof T]: T[K] extends Types.ObjectId
    ? string
    : T[K] extends Types.ObjectId[]
      ? string[]
      : T[K];
};

// Replace specific properties in T with properties from R
export type Override<T, R extends Partial<Record<keyof T, unknown>>> = Omit<
  T,
  keyof R
> &
  R;
