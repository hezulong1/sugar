import { watch } from 'vue-demi';
import type { MaybeRefOrGetter, IDisposable } from '../_utils/types';
import { type MaybeElementRef, unrefElement } from '../_utils/unrefElement';
import { tryOnScopeDispose } from './tryOnScopeDispose';

export function useEventListener<K extends keyof GlobalEventHandlersEventMap>(target: MaybeRefOrGetter<EventTarget>, type: K, handler: (event: GlobalEventHandlersEventMap[K]) => void, useCapture?: boolean): IDisposable;
export function useEventListener(target: MaybeRefOrGetter<EventTarget>, type: string, handler: (event: any) => void, useCapture?: boolean): IDisposable;
export function useEventListener(target: MaybeRefOrGetter<EventTarget>, type: string, handler: (event: any) => void, options: AddEventListenerOptions): IDisposable;
export function useEventListener(target: MaybeRefOrGetter<EventTarget>, type: string, handler: (event: any) => void, useCaptureOrOptions?: boolean | AddEventListenerOptions): IDisposable {
  let _toDisposed: IDisposable | null;

  const cleanup = () => {
    if (_toDisposed) {
      _toDisposed.dispose();
      _toDisposed = null;
    }
  };

  const stopWatch = watch(
    () => unrefElement(<MaybeElementRef><unknown>target),
    (el) => {
      cleanup();

      if (!el) return;

      el.addEventListener(type, handler, useCaptureOrOptions);
      _toDisposed = {
        dispose: () => el.removeEventListener(type, handler, useCaptureOrOptions),
      };
    },
    { immediate: true, flush: 'post' },
  );

  const dispose = () => {
    stopWatch();
    cleanup();
  };

  tryOnScopeDispose(dispose);

  return { dispose };
}
