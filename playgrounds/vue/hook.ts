import { toValue, type MaybeRefOrGetter, computed } from 'vue';

export interface UseTestOptions {
  msg: MaybeRefOrGetter<string>;
}

function useWrap(s: MaybeRefOrGetter<string>) {
  return computed(() => toValue(s) + '::suffix');
}

export function useTest(opts: UseTestOptions) {
  return {
    msg: useWrap(opts.msg),
  };
}
