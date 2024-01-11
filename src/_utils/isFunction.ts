import type { AnyFn } from './types';

export const isFunction = (val: unknown): val is AnyFn => typeof val === 'function';
