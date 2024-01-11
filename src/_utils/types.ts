import type { Ref } from 'vue-demi';

export interface IDisposable {
  dispose(): void;
}

export type AnyFn = (...args: any[]) => any;
export type VoidFn = (...args: any[]) => void;

// take from vue@3.3.11
export type MaybeRef<T = any> = T | Ref<T>;
export type MaybeRefOrGetter<T = any> = MaybeRef<T> | (() => T);
