import type { ConfigurableWindow, MaybeElementRef, MaybeRef, MaybeRefOrGetter } from '@vueuse/core';
import { toValue, useEventListener, tryOnScopeDispose } from '@vueuse/core';
import { computed, ref, watchEffect } from 'vue-demi';

export interface IPointerMoveCallback {
  (event: PointerEvent): void;
}

export interface IPointerStopCallback {
  (browserEvent?: PointerEvent | KeyboardEvent): void;
}

export interface UseGlobalPointerMoveMonitorOptions extends ConfigurableWindow {

}

export function useGlobalPointerMoveMonitor(
  target: MaybeRefOrGetter<Element>,
  pointerId: number,
  initialButtons: number,
  pointerMoveCallback: IPointerMoveCallback,
  pointerStopCallback: IPointerStopCallback,
  options: UseGlobalPointerMoveMonitorOptions = {},
) {
  const {
    window: defaultWindow,
  } = options;

  let _onMove: IPointerMoveCallback | null;
  let isMonitoring = computed(() => Boolean(_onMove));
  let eventTarget = computed(() => {
    let initialElement = toValue(target);
    let source: Element | Window | undefined = initialElement;
    try {
      initialElement.setPointerCapture(pointerId);
    } catch (err) {
      source = defaultWindow;
    }
    return source;
  });

  let cleanups = [
    () => {
      try {
        initialElement.releasePointerCapture(pointerId);
      } catch (err) {
        // See https://developer.mozilla.org/en-US/docs/Web/API/Element/releasePointerCapture#exceptions
      }
    },
    useEventListener(eventTarget, 'pointermove', (e: PointerEvent) => {
      _pointerMoveCallback = pointerMoveCallback;

      if (e.buttons !== initialButtons) {
        // Buttons state has changed in the meantime
        stop(true);
        return;
      }

      e.preventDefault();
      _pointerMoveCallback(e);
    }),
    useEventListener(eventTarget, 'pointerup', (e: PointerEvent) => {
      stop(true);
    }),
  ];

  const stop = (invokeStopCallback: boolean, browserEvent?: PointerEvent | KeyboardEvent) => {
    if (!isMonitoring.value) return;
    _onMove = null;
    if (invokeStopCallback && typeof pointerStopCallback === 'function') {
      pointerStopCallback(browserEvent);
    }
  };

  const stopWatch = watchEffect(() => {
    if (isMonitoring.value) {
      stop(false);
    }
  }, { flush: 'post' });

  const dispose = () => {
    cleanups.forEach(fn => fn());
    stopWatch();
  };

  tryOnScopeDispose(dispose);

  return dispose;
}
