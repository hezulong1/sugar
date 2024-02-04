import { toValue, type MaybeRefOrGetter } from '@vueuse/core';
import { useRound, useMax, useFloor } from '@vueuse/math';
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

  const _computedAvailableSize = ref(0);
  const _computedIsNeeded = ref(false);
  const _computedSliderSize = ref(0);
  const _computedSliderRatio = ref(0);
  const _computedSliderPosition = ref(0);

  function _computeValues(
    _oppositeScrollbarSize: number,
    _arrowSize: number,
    _visibleSize: number,
    _scrollSize: number,
    _scrollPosition: number,
  ) {
    const computedAvailableSize = Math.max(0, _visibleSize - _oppositeScrollbarSize);
    const computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * _arrowSize);
    const computedIsNeeded = (_scrollSize > 0 && _scrollSize > _visibleSize);

    if (!computedIsNeeded) {
      // There is no need for a slider
      return {
        computedAvailableSize: Math.round(computedAvailableSize),
        computedIsNeeded,
        computedSliderSize: Math.round(computedRepresentableSize),
        computedSliderRatio: 0,
        computedSliderPosition: 0,
      };
    }

    // We must artificially increase the size of the slider if needed, since the slider would be too small to grab with the mouse otherwise
    const computedSliderSize = Math.round(Math.max(MINIMUM_SLIDER_SIZE, Math.floor(_visibleSize * computedRepresentableSize / _scrollSize)));

    // The slider can move from 0 to `computedRepresentableSize` - `computedSliderSize`
    // in the same way `scrollPosition` can move from 0 to `scrollSize` - `visibleSize`.
    const computedSliderRatio = (computedRepresentableSize - computedSliderSize) / (_scrollSize - _visibleSize);
    const computedSliderPosition = (_scrollPosition * computedSliderRatio);

    return {
      computedAvailableSize: Math.round(computedAvailableSize),
      computedIsNeeded,
      computedSliderSize: Math.round(computedSliderSize),
      computedSliderRatio,
      computedSliderPosition: Math.round(computedSliderPosition),
    };
  }

  function _refresh(_visibleSize: number, _scrollSize: number, _scrollPosition: number) {
    const r = _computeValues(
      oppositeScrollbarSize.value,
      arrowSize.value,
      _visibleSize,
      _scrollSize,
      _scrollPosition,
    );
    _computedAvailableSize.value = r.computedAvailableSize;
    _computedIsNeeded.value = r.computedIsNeeded;
    _computedSliderSize.value = r.computedSliderSize;
    _computedSliderRatio.value = r.computedSliderRatio;
    _computedSliderPosition.value = r.computedSliderPosition;
  }

  _refresh(toValue(rawVisibleSize), toValue(rawScrollSize), toValue(rawScrollPosition));

  watch(() => [
    toValue(rawVisibleSize),
    toValue(rawScrollSize),
    toValue(rawScrollPosition),
  ], ([_visibleSize, _scrollSize, _scrollPosition]) => {
    _refresh(
      Math.round(_visibleSize),
      Math.round(_scrollSize),
      Math.round(_scrollPosition),
    );
  });

  /**
   * `visibleSize` - `oppositeScrollbarSize`
   */
  const computedAvailableSize = useRound(useMax(0, toValue(visibleSize) - toValue(oppositeScrollbarSize)));
  const computedRepresentableSize = useMax(0, toValue(computedAvailableSize) - 2 * toValue(arrowSize));

  /**
   * (`scrollSize` > 0 && `scrollSize` > `visibleSize`)
   */
  const computedIsNeeded = computed(() => scrollSize.value > 0 && scrollSize.value > visibleSize.value);
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
    rectangleLargeSize: readonly(computedAvailableSize),
    rectangleSmallSize: readonly(scrollbarSize),
    isNeeded: computedIsNeeded,
    sliderSize: computedSliderSize,
    sliderPosition: computedSliderPosition,
  };
}
