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

// Serializable Map
export type S_Map<K extends string, V> = {
  data: Record<K, V>;
  size: number;
};
// Serializable Set
export type S_Set<K extends string> = S_Map<K, undefined>;
