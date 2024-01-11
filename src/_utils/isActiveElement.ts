import { getActiveElement } from './getActiveElement';

export function isActiveElement(element: Element): boolean {
  return getActiveElement() === element;
}
