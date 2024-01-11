// take from vueuse@10.7.1

import { getCurrentScope, onScopeDispose } from 'vue-demi';
import type { VoidFn } from '../_utils/types';

export function tryOnScopeDispose(fn: VoidFn) {
  if (getCurrentScope()) {
    onScopeDispose(fn);
    return true;
  }
  return false;
}
