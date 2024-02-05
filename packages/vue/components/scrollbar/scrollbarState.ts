import { toValue, type MaybeRefOrGetter } from '@vueuse/core';
import { computed, readonly, ref, watch } from 'vue-demi';

const MINIMUM_SLIDER_SIZE = 20;

export function useScrollbarState(
  rawArrowSize: MaybeRefOrGetter<number>,
  rawScrollbarSize: MaybeRefOrGetter<number>,
  rawOppositeScrollbarSize: MaybeRefOrGetter<number>,
  rawVisibleSize: MaybeRefOrGetter<number>,
  rawScrollSize: MaybeRefOrGetter<number>,
  rawScrollPosition: MaybeRefOrGetter<number>,
) {
  /**
   * For the vertical scrollbar: the height of the scrollbar's arrows.
   * For the horizontal scrollbar: the width of the scrollbar's arrows.
   */
  const arrowSize = computed(() => Math.round(toValue(rawArrowSize)));

  /**
   * For the vertical scrollbar: the width.
   * For the horizontal scrollbar: the height.
   */
  const scrollbarSize = computed(() => Math.round(toValue(rawScrollbarSize)));

  /**
   * For the vertical scrollbar: the height of the pair horizontal scrollbar.
   * For the horizontal scrollbar: the width of the pair vertical scrollbar.
   */
  const oppositeScrollbarSize = computed(() => Math.round(toValue(rawOppositeScrollbarSize)));

  /**
   * For the vertical scrollbar: the viewport height.
   * For the horizontal scrollbar: the viewport width.
   */
  const visibleSize = ref(toValue(rawVisibleSize));

  /**
   * For the vertical scrollbar: the scroll height.
   * For the horizontal scrollbar: the scroll width.
   */
  const scrollSize = ref(toValue(rawScrollSize));

  /**
   * For the vertical scrollbar: the scroll top.
   * For the horizontal scrollbar: the scroll left.
   */
  const scrollPosition = ref(toValue(rawScrollPosition));

  watch(() => [
    toValue(rawVisibleSize),
    toValue(rawScrollSize),
    toValue(rawScrollPosition),
  ], ([_visibleSize, _scrollSize, _scrollPosition]) => {
    const iVisibleSize = Math.round(_visibleSize);
    if (visibleSize.value !== iVisibleSize) {
      visibleSize.value = iVisibleSize;
    }

    const iScrollSize = Math.round(_scrollSize);
    if (scrollSize.value !== iScrollSize) {
      scrollSize.value = iScrollSize;
    }

    const iScrollPosition = Math.round(_scrollPosition);
    if (scrollPosition.value !== iScrollPosition) {
      scrollPosition.value = iScrollPosition;
    }
  });

  /**
   * `visibleSize` - `oppositeScrollbarSize`
   */
  const _computedAvailableSize = computed(() => Math.max(0, visibleSize.value - oppositeScrollbarSize.value));
  const _computedRepresentableSize = computed(() => Math.max(0, _computedAvailableSize.value - 2 * arrowSize.value));

  /**
   * (`scrollSize` > 0 && `scrollSize` > `visibleSize`)
   */
  const computedIsNeeded = computed(() => scrollSize.value > 0 && scrollSize.value > visibleSize.value);
  const computedAvailableSize = computed(() => Math.round(_computedAvailableSize.value));
  const computedSliderSize = computed(
    () => computedIsNeeded.value
      // We must artificially increase the size of the slider if needed, since the slider would be too small to grab with the mouse otherwise
      ? Math.round(Math.max(MINIMUM_SLIDER_SIZE, Math.floor(visibleSize.value * _computedRepresentableSize.value / scrollSize.value)))
      : Math.round(_computedRepresentableSize.value),
  );
  const computedSliderRatio = computed(
    () => computedIsNeeded.value
      // The slider can move from 0 to `computedRepresentableSize` - `computedSliderSize`
      // in the same way `scrollPosition` can move from 0 to `scrollSize` - `visibleSize`.
      ? (_computedRepresentableSize.value - computedSliderSize.value) / (scrollSize.value - visibleSize.value)
      : 0,
  );
  const computedSliderPosition = computed(
    () => computedIsNeeded.value
      ? Math.round(scrollPosition.value * computedSliderRatio.value)
      : 0,
  );

  /**
   * Compute a desired `scrollPosition` such that `offset` ends up in the center of the slider.
   * `offset` is based on the same coordinate system as the `sliderPosition`.
   */
  function getDesiredScrollPositionFromOffset(offset: MaybeRefOrGetter<number>) {
    return computed(() => {
      if (!computedIsNeeded.value) {
        // no need for a slider
        return 0;
      }

      const desiredSliderPosition = toValue(offset) - arrowSize.value - computedSliderSize.value / 2;
      return Math.round(desiredSliderPosition / computedSliderRatio.value);
    });
  }

  /**
   * Compute a desired `scrollPosition` from if offset is before or after the slider position.
   * If offset is before slider, treat as a page up (or left).  If after, page down (or right).
   * `offset` and `_computedSliderPosition` are based on the same coordinate system.
   * `_visibleSize` corresponds to a "page" of lines in the returned coordinate system.
   */
  function getDesiredScrollPositionFromOffsetPaged(offset: MaybeRefOrGetter<number>) {
    return computed(() => {
      if (!computedIsNeeded.value) {
        // no need for a slider
        return 0;
      }

      const correctedOffset = toValue(offset) - arrowSize.value; // compensate if has arrows
      let desiredScrollPosition = scrollPosition.value;
      if (correctedOffset < computedSliderPosition.value) {
        desiredScrollPosition -= visibleSize.value; // page up/left
      } else {
        desiredScrollPosition += visibleSize.value; // page down/right
      }
      return desiredScrollPosition;
    });
  }

  /**
   * Compute a desired `scrollPosition` such that the slider moves by `delta`.
   */
  function getDesiredScrollPositionFromDelta(delta: MaybeRefOrGetter<number>) {
    return computed(() => {
      if (!computedIsNeeded.value) {
        // no need for a slider
        return 0;
      }

      const desiredSliderPosition = computedSliderPosition.value + toValue(delta);
      return Math.round(desiredSliderPosition / computedSliderRatio.value);
    });
  }

  return {
    arrowSize: readonly(arrowSize),
    scrollPosition: readonly(scrollPosition),
    rectangleLargeSize: readonly(computedAvailableSize),
    rectangleSmallSize: readonly(scrollbarSize),
    isNeeded: readonly(computedIsNeeded),
    sliderSize: readonly(computedSliderSize),
    sliderPosition: readonly(computedSliderPosition),
    getDesiredScrollPositionFromOffset,
    getDesiredScrollPositionFromOffsetPaged,
    getDesiredScrollPositionFromDelta,
  };
}
