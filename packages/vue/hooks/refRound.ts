import { customRef } from 'vue-demi';

export function refRound(value: number) {
  return customRef<number>((track, trigger) => {
    let source = value;

    return {
      get() {
        debugger;
        track();
        return source;
      },

      set(v) {
        debugger;
        const iv = Math.round(v);
        if (iv !== source) {
          source = iv;
          trigger();
        }
      },
    };
  });
}
