import { computed } from 'vue-demi';
import { toValue, type MaybeRefOrGetter } from '@vueuse/core';
import { useScrollbarVisiblityController } from './scrollbarVisibilityController';
import { useScrollbarState } from './scrollbarState';
import type { INewScrollPosition, ScrollbarVisibility } from './scrollable';

/**
 * The orthogonal distance to the slider at which dragging "resets". This implements "snapping"
 */
export const POINTER_DRAG_RESET_DISTANCE = 140;

export interface ScrollbarOptions {
  visibility?: ScrollbarVisibility;
  hasArrows?: boolean;
  arrowSize?: number;

  scrollbarSize: number;
  oppositeScrollbarSize: number;
  sliderSize: number;

  visibleSize: number;
  scrollSize: number;
  scrollPosition: number;

  scrollByPage: boolean;
}

export interface ScrollbarEmits {
  (e: 'hostMousewheel', deltaX: number, deltaY: number): void;
  (e: 'hostDragstart'): void;
  (e: 'hostDragend'): void;

  (e: 'setScrollPositionNow', desiredScrollPosition: INewScrollPosition): void;
}

export interface UseAbstractScrollbarOptions {
  visibility: MaybeRefOrGetter<ScrollbarVisibility>;
  arrowSize: MaybeRefOrGetter<number>;
  scrollbarSize: MaybeRefOrGetter<number>;
  oppositeScrollbarSize: MaybeRefOrGetter<number>;
  visibleSize: MaybeRefOrGetter<number>;
  scrollSize: MaybeRefOrGetter<number>;
  scrollPosition: MaybeRefOrGetter<number>;
}

export function useAbstractScrollbar(opts: UseAbstractScrollbarOptions) {
  const _visibility = computed(() => toValue(opts.visibility));
  const _arrowSize = computed(() => toValue(opts.arrowSize));
  const _scrollbarSize = computed(() => toValue(opts.scrollbarSize));
  const _oppositeScrollbarSize = computed(() => toValue(opts.oppositeScrollbarSize));
  const _visibleSize = computed(() => toValue(opts.visibleSize));
  const _scrollSize = computed(() => toValue(opts.scrollSize));
  const _scrollPosition = computed(() => toValue(opts.scrollPosition));

  const controller = useScrollbarVisiblityController(_visibility, 'scrollbar visible', 'scrollbar invisible');
  const state = useScrollbarState(_arrowSize, _scrollbarSize, _oppositeScrollbarSize, _visibleSize, _scrollSize, _scrollPosition);

  return {
    controller,
    state,
  };
}
