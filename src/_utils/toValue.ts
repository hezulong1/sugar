// take from vue@3.3.11

import { unref, type ComputedRef } from 'vue-demi';
import type { MaybeRefOrGetter } from './types';
import { isFunction } from './isFunction';

/**
 *
 * @example
 * ```js
 * toValue(1) // 1
 * toValue(ref(1)) // 1
 * toValue(() => 1) // 1
 * ```
 *
 * @param source - A getter, an existing ref, or a non-function value.
 * @see {@link https://vuejs.org/api/reactivity-utilities.html#tovalue}
 */
export function toValue<T>(source: MaybeRefOrGetter<T> | ComputedRef<T>): T {
  return isFunction(source) ? source() : unref(source);
}
