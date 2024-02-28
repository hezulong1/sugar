import { customRef } from 'vue-demi';

export function refRound(value: number, always = false) {
  return customRef<number>((track, trigger) => {
    let source = always ? Math.round(value) : value;

    return {
      get() {
        track();
        return source;
      },

      set(v) {
        const iv = Math.round(v);
        if (iv !== source) {
          source = iv;
          trigger();
        }
      },

    };
  });
}
