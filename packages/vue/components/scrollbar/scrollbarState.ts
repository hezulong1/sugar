import { toValue, type MaybeRefOrGetter } from '@vueuse/core';
import { useRound, useMax, useFloor } from '@vueuse/math';
import { computed, readonly, ref } from 'vue-demi';

const MINIMUM_SLIDER_SIZE = 20;

export function useScrollbarState(
  rawArrowSize: MaybeRefOrGetter<number>,
  rawScrollbarSize: MaybeRefOrGetter<number>,
  rawOppositeScrollbarSize: MaybeRefOrGetter<number>,
  visibleSize: MaybeRefOrGetter<number>,
  scrollSize: MaybeRefOrGetter<number>,
  scrollPosition: MaybeRefOrGetter<number>,
) {
  /**
   * For the vertical scrollbar: the height of the scrollbar's arrows.
   * For the horizontal scrollbar: the width of the scrollbar's arrows.
   */
  const arrowSize = useRound(rawArrowSize);

  /**
   * For the vertical scrollbar: the width.
   * For the horizontal scrollbar: the height.
   */
  const scrollbarSize = useRound(rawScrollbarSize);

  /**
   * For the vertical scrollbar: the height of the pair horizontal scrollbar.
   * For the horizontal scrollbar: the width of the pair vertical scrollbar.
   */
  const oppositeScrollbarSize = useRound(rawOppositeScrollbarSize);

  const computedAvailableSize = useRound(useMax(0, toValue(visibleSize) - toValue(oppositeScrollbarSize)));
  const computedRepresentableSize = useMax(0, toValue(computedAvailableSize) - 2 * toValue(arrowSize));
  const computedIsNeeded = computed(() => {
    const scrollSizeValue = toValue(scrollSize);
    const visibleSizeValue = toValue(visibleSize);
    return scrollSizeValue > 0 && scrollSizeValue > visibleSizeValue;
  });
  const computedSliderSize = useRound(
    computedIsNeeded.value
      // We must artificially increase the size of the slider if needed, since the slider would be too small to grab with the mouse otherwise
      ? useMax(MINIMUM_SLIDER_SIZE, useFloor(toValue(visibleSize) * toValue(computedRepresentableSize) / toValue(scrollSize)))
      : computedRepresentableSize,
  );
  const computedSliderRatio = computed(
    () => computedIsNeeded.value
      // The slider can move from 0 to `computedRepresentableSize` - `computedSliderSize`
      // in the same way `scrollPosition` can move from 0 to `scrollSize` - `visibleSize`.
      ? (toValue(computedRepresentableSize) - toValue(computedSliderSize)) / (toValue(scrollSize) - toValue(visibleSize))
      : 0,
  );
  const computedSliderPosition = computed(
    () => computedIsNeeded.value
      ? toValue(useRound(toValue(scrollPosition) * toValue(computedSliderRatio)))
      : 0,
  );

  return {
    arrowSize: readonly(arrowSize),
  };
}
