import type { AnyFn, ConfigurableWindow } from '@vueuse/core';
import { useEventListener, tryOnScopeDispose, defaultWindow } from '@vueuse/core';
import { computed, readonly, ref } from 'vue-demi';

export interface IOnMoveCallback {
  (event: PointerEvent): void;
}

export interface IOnStopCallback {
  (browserEvent?: PointerEvent | KeyboardEvent): void;
}

export interface UsePointerMoveOptions extends ConfigurableWindow {}

export function usePointerMove(options: UsePointerMoveOptions = {}) {
  const { window = defaultWindow } = options;

  let _hooks = new Set<AnyFn>();

  const _onMove = ref<IOnMoveCallback | null>(null);
  const _onStop = ref<IOnStopCallback | null>(null);
  const isMonitoring = computed(() => Boolean(_onMove.value));

  const _clear = () => {
    if (_hooks.size === 0) return;

    const errors: any[] = [];

    for (let cleanup of _hooks) {
      try {
        cleanup();
      } catch (err) {
        errors.push(err);
      }
    }

    try {
      if (errors.length === 1) {
        throw errors[0];
      } else if (errors.length > 1) {
        if (typeof AggregateError !== 'undefined') {
          throw new AggregateError(errors, 'Encountered errors while do hooks');
        } else {
          throw errors;
        }
      }
    } finally {
      _hooks.clear();
    }
  };

  const stop = (invokeStopCallback: boolean, browserEvent?: PointerEvent | KeyboardEvent) => {
    if (!isMonitoring.value) {
      return;
    }

    _clear();
    _onMove.value = null;

    const { value: onStop } = _onStop;
    _onStop.value = null;

    if (invokeStopCallback && onStop) {
      onStop(browserEvent);
    }
  };

  const start = (
    initialElement: Element,
    pointerId: number,
    initialButtons: number,
    onMoveCallback: IOnMoveCallback,
    onStopCallback: IOnStopCallback,
  ) => {
    if (isMonitoring.value) {
      stop(false);
    }

    _onMove.value = onMoveCallback;
    _onStop.value = onStopCallback;

    let eventSource: Element | Window | undefined = initialElement;

    try {
      initialElement.setPointerCapture(pointerId);
      _hooks.add(() => {
        try {
          initialElement.releasePointerCapture(pointerId);
        } catch (err) {
          // DOMException: Failed to execute 'releasePointerCapture' on 'Element'
        }
      });
    } catch (err) {
      // DOMException: Failed to execute 'setPointerCapture' on 'Element'
      eventSource = window;
    }

    if (!eventSource) return;

    _hooks.add(useEventListener(eventSource, 'pointermove', (e: PointerEvent) => {
      if (e.buttons !== initialButtons) {
        stop(true);
        return;
      }

      e.preventDefault();
      _onMove.value!(e);
    }));

    _hooks.add(useEventListener(eventSource, 'pointerup', (e: PointerEvent) => stop(true)));
  };

  const dispose = () => {
    stop(false);
  };

  tryOnScopeDispose(dispose);

  return {
    isMonitoring: readonly(isMonitoring),
    start,
    stop,
    dispose,
  };
}
