import type { S_Map, S_Set } from "@/types/utils";

export function new_S<K extends string, V = true>() {
  return {
    data: {},
    size: 0,
  } as V extends true ? S_Set<K> : S_Map<K, V>;
}

export function set_S<K extends string, V>(set: S_Map<K, V>, key: K, value: V) {
  if (key in set.data) return;
  set.data[key] = value;
  set.size++;
}

export function add_S<K extends string>(set: S_Set<K>, key: K) {
  set_S(set, key, true);
}

export function remove_S<K extends string, V>(set: S_Map<K, V>, key: K) {
  if (!(key in set.data)) return;
  delete set.data[key];
  set.size--;
}

export function clear_S<K extends string, V>(set: S_Map<K, V>) {
  set.data = {} as Record<K, V>;
  set.size = 0;
}

export function get_S<K extends string, V>(
  set: S_Map<K, V>,
  key: K,
): V | undefined {
  return set.data[key];
}

export function has_S<K extends string, V>(set: S_Map<K, V>, key: K) {
  return key in set.data;
}

export function isEmpty_S<K extends string, V>(set: S_Map<K, V>) {
  return set.size === 0;
}

export function keys_S<K extends string, V>(set: S_Map<K, V>) {
  return Object.keys(set.data);
}

export function values_S<K extends string, V>(set: S_Map<K, V>) {
  return Object.values(set.data) as V[];
}

export function toArray_S<K extends string>(set: S_Set<K>) {
  return Object.keys(set.data);
}
