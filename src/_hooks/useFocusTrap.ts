import { unrefElement } from '../_utils/unrefElement';
import type { MaybeRefOrGetter, AnyFn } from '../_utils/types';
import { getWindow } from '../_utils/getWindow';
import { useEventListener } from './useEventListener';
import { isActiveElement } from 'src/_utils/isActiveElement';

export interface UseFocusTrapOptions {

}

export function useFocusTrap(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UseFocusTrapOptions = {},
) {
  const container = unrefElement(target);
  if (!container) return;

  const window = getWindow(container);

  useEventListener(window, 'keydown', (event) => {
    if (event.altKey) {
      event.preventDefault();
    }

    let focusableElements: { focus: AnyFn }[] = [];
    let focusedIndex = -1;
    let handler = false;

    Array.from(container.querySelectorAll('a')).forEach((link) => {
      focusableElements.push(link);
      if (isActiveElement(link)) {
        focusedIndex = focusableElements.length - 1;
      }
    });

    Array.from(container.querySelectorAll('input')).forEach((input) => {

    });

    const tabDown = event.keyCode === 9 || event.key === 'Tab';

    if (tabDown) {
      handler = true;
    }

    if (handler) {
      event.preventDefault();
    }
  }, true);
}
