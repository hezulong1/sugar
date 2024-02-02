import { ref } from 'vue-demi';
import type { ScrollbarVisibility } from './scrollable';
import { useScrollbarVisiblityController } from './scrollbarVisibilityController';

/**
 * The orthogonal distance to the slider at which dragging "resets". This implements "snapping"
 */
export const POINTER_DRAG_RESET_DISTANCE = 140;

export interface ScrollbarOptions {
  vertical: boolean;
  visibility?: ScrollbarVisibility;
  hasArrows?: boolean;
  arrowSize?: number;
  scrollByPage?: boolean;
}

export interface UseAbstractScrollbarOptions {
  visibility: ScrollbarVisibility;
  visibleClassName: string;
  invisibleClassName: string;
}

export function useAbstractScrollbar(opts: UseAbstractScrollbarOptions) {
  const visibility = ref(opts.visibility);
  const visibilityController = useScrollbarVisiblityController(visibility, 'scrollbar visible', 'scrollbar invisible');
}
