import type { MaybeRefOrGetter } from '@vueuse/core';

import { computed, ref, watch } from 'vue-demi';
import { toValue } from '@vueuse/core';

/**
 * The minimal size of the slider (such that it can still be clickable) -- it is artificially enlarged.
 */
const MINIMUM_SLIDER_SIZE = 20;

export class ScrollbarState {
  /**
   * For the vertical scrollbar: the width.
   * For the horizontal scrollbar: the height.
   */
  private _scrollbarSize: number;

  /**
   * For the vertical scrollbar: the height of the pair horizontal scrollbar.
   * For the horizontal scrollbar: the width of the pair vertical scrollbar.
   */
  private _oppositeScrollbarSize: number;

  /**
   * For the vertical scrollbar: the height of the scrollbar's arrows.
   * For the horizontal scrollbar: the width of the scrollbar's arrows.
   */
  private readonly _arrowSize: number;

  // --- variables
  /**
   * For the vertical scrollbar: the viewport height.
   * For the horizontal scrollbar: the viewport width.
   */
  private _visibleSize: number;

  /**
   * For the vertical scrollbar: the scroll height.
   * For the horizontal scrollbar: the scroll width.
   */
  private _scrollSize: number;

  /**
   * For the vertical scrollbar: the scroll top.
   * For the horizontal scrollbar: the scroll left.
   */
  private _scrollPosition: number;

  // --- computed variables

  /**
   * `visibleSize` - `oppositeScrollbarSize`
   */
  private _computedAvailableSize: number;
  /**
   * (`scrollSize` > 0 && `scrollSize` > `visibleSize`)
   */
  private _computedIsNeeded: boolean;

  private _computedSliderSize: number;
  private _computedSliderRatio: number;
  private _computedSliderPosition: number;

  constructor(arrowSize: number, scrollbarSize: number, oppositeScrollbarSize: number, visibleSize: number, scrollSize: number, scrollPosition: number) {
    this._scrollbarSize = Math.round(scrollbarSize);
    this._oppositeScrollbarSize = Math.round(oppositeScrollbarSize);
    this._arrowSize = Math.round(arrowSize);

    this._visibleSize = visibleSize;
    this._scrollSize = scrollSize;
    this._scrollPosition = scrollPosition;

    this._computedAvailableSize = 0;
    this._computedIsNeeded = false;
    this._computedSliderSize = 0;
    this._computedSliderRatio = 0;
    this._computedSliderPosition = 0;

    this._refreshComputedValues();
  }

  public clone(): ScrollbarState {
    return new ScrollbarState(this._arrowSize, this._scrollbarSize, this._oppositeScrollbarSize, this._visibleSize, this._scrollSize, this._scrollPosition);
  }

  public setVisibleSize(visibleSize: number): boolean {
    const iVisibleSize = Math.round(visibleSize);
    if (this._visibleSize !== iVisibleSize) {
      this._visibleSize = iVisibleSize;
      this._refreshComputedValues();
      return true;
    }
    return false;
  }

  public setScrollSize(scrollSize: number): boolean {
    const iScrollSize = Math.round(scrollSize);
    if (this._scrollSize !== iScrollSize) {
      this._scrollSize = iScrollSize;
      this._refreshComputedValues();
      return true;
    }
    return false;
  }

  public setScrollPosition(scrollPosition: number): boolean {
    const iScrollPosition = Math.round(scrollPosition);
    if (this._scrollPosition !== iScrollPosition) {
      this._scrollPosition = iScrollPosition;
      this._refreshComputedValues();
      return true;
    }
    return false;
  }

  public setScrollbarSize(scrollbarSize: number): void {
    this._scrollbarSize = Math.round(scrollbarSize);
  }

  public setOppositeScrollbarSize(oppositeScrollbarSize: number): void {
    this._oppositeScrollbarSize = Math.round(oppositeScrollbarSize);
  }

  private static _computeValues(oppositeScrollbarSize: number, arrowSize: number, visibleSize: number, scrollSize: number, scrollPosition: number) {
    const computedAvailableSize = Math.max(0, visibleSize - oppositeScrollbarSize);
    const computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * arrowSize);
    const computedIsNeeded = (scrollSize > 0 && scrollSize > visibleSize);

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
    const computedSliderSize = Math.round(Math.max(MINIMUM_SLIDER_SIZE, Math.floor(visibleSize * computedRepresentableSize / scrollSize)));

    // The slider can move from 0 to `computedRepresentableSize` - `computedSliderSize`
    // in the same way `scrollPosition` can move from 0 to `scrollSize` - `visibleSize`.
    const computedSliderRatio = (computedRepresentableSize - computedSliderSize) / (scrollSize - visibleSize);
    const computedSliderPosition = (scrollPosition * computedSliderRatio);

    return {
      computedAvailableSize: Math.round(computedAvailableSize),
      computedIsNeeded,
      computedSliderSize: Math.round(computedSliderSize),
      computedSliderRatio,
      computedSliderPosition: Math.round(computedSliderPosition),
    };
  }

  private _refreshComputedValues(): void {
    const r = ScrollbarState._computeValues(this._oppositeScrollbarSize, this._arrowSize, this._visibleSize, this._scrollSize, this._scrollPosition);
    this._computedAvailableSize = r.computedAvailableSize;
    this._computedIsNeeded = r.computedIsNeeded;
    this._computedSliderSize = r.computedSliderSize;
    this._computedSliderRatio = r.computedSliderRatio;
    this._computedSliderPosition = r.computedSliderPosition;
  }

  public getArrowSize(): number {
    return this._arrowSize;
  }

  public getScrollPosition(): number {
    return this._scrollPosition;
  }

  public getRectangleLargeSize(): number {
    return this._computedAvailableSize;
  }

  public getRectangleSmallSize(): number {
    return this._scrollbarSize;
  }

  public isNeeded(): boolean {
    return this._computedIsNeeded;
  }

  public getSliderSize(): number {
    return this._computedSliderSize;
  }

  public getSliderPosition(): number {
    return this._computedSliderPosition;
  }

  /**
   * Compute a desired `scrollPosition` such that `offset` ends up in the center of the slider.
   * `offset` is based on the same coordinate system as the `sliderPosition`.
   */
  public getDesiredScrollPositionFromOffset(offset: number): number {
    if (!this._computedIsNeeded) {
      // no need for a slider
      return 0;
    }

    const desiredSliderPosition = offset - this._arrowSize - this._computedSliderSize / 2;
    return Math.round(desiredSliderPosition / this._computedSliderRatio);
  }

  /**
   * Compute a desired `scrollPosition` from if offset is before or after the slider position.
   * If offset is before slider, treat as a page up (or left).  If after, page down (or right).
   * `offset` and `_computedSliderPosition` are based on the same coordinate system.
   * `_visibleSize` corresponds to a "page" of lines in the returned coordinate system.
   */
  public getDesiredScrollPositionFromOffsetPaged(offset: number): number {
    if (!this._computedIsNeeded) {
      // no need for a slider
      return 0;
    }

    const correctedOffset = offset - this._arrowSize; // compensate if has arrows
    let desiredScrollPosition = this._scrollPosition;
    if (correctedOffset < this._computedSliderPosition) {
      desiredScrollPosition -= this._visibleSize; // page up/left
    } else {
      desiredScrollPosition += this._visibleSize; // page down/right
    }
    return desiredScrollPosition;
  }

  /**
   * Compute a desired `scrollPosition` such that the slider moves by `delta`.
   */
  public getDesiredScrollPositionFromDelta(delta: number): number {
    if (!this._computedIsNeeded) {
      // no need for a slider
      return 0;
    }

    const desiredSliderPosition = this._computedSliderPosition + delta;
    return Math.round(desiredSliderPosition / this._computedSliderRatio);
  }
}

export function useScrollbarState(
  initialArrowSize: MaybeRefOrGetter<number>,
  initialScrollbarSize: MaybeRefOrGetter<number>,
  initialOppositeScrollbarSize: MaybeRefOrGetter<number>,
  initialVisibleSize: MaybeRefOrGetter<number>,
  initialScrollSize: MaybeRefOrGetter<number>,
  initialScrollPosition: MaybeRefOrGetter<number>,
) {
  /**
   * For the vertical scrollbar: the height of the scrollbar's arrows.
   * For the horizontal scrollbar: the width of the scrollbar's arrows.
   */
  const arrowSize = computed(() => Math.round(toValue(initialArrowSize)));

  /**
   * For the vertical scrollbar: the width.
   * For the horizontal scrollbar: the height.
   */
  const scrollbarSize = computed(() => Math.round(toValue(initialScrollbarSize)));

  /**
   * For the vertical scrollbar: the height of the pair horizontal scrollbar.
   * For the horizontal scrollbar: the width of the pair vertical scrollbar.
   */
  const oppositeScrollbarSize = computed(() => Math.round(toValue(initialOppositeScrollbarSize)));

  /**
   * For the vertical scrollbar: the viewport height.
   * For the horizontal scrollbar: the viewport width.
   */
  const visibleSize = computed(() => Math.round(toValue(initialVisibleSize)));

  /**
   * For the vertical scrollbar: the scroll height.
   * For the horizontal scrollbar: the scroll width.
   */
  const scrollSize = computed(() => Math.round(toValue(initialScrollSize)));

  /**
   * For the vertical scrollbar: the scroll top.
   * For the horizontal scrollbar: the scroll left.
   */
  const scrollPosition = computed(() => Math.round(toValue(initialScrollPosition)));

  // 首次计算 initialVisibleSize，initialScrollSize，initialScrollPosition 不做四舍五入
  // 后续计算使用四舍五入
  let r = _computeValues(
    oppositeScrollbarSize.value,
    arrowSize.value,
    toValue(initialVisibleSize),
    toValue(initialScrollSize),
    toValue(initialScrollPosition),
  );

  const _computedAvailableSize = ref(r.computedAvailableSize);
  const _computedIsNeeded = ref(r.computedIsNeeded);
  const _computedSliderSize = ref(r.computedSliderSize);
  const _computedSliderRatio = ref(r.computedSliderRatio);
  const _computedSliderPosition = ref(r.computedSliderPosition);

  watch([oppositeScrollbarSize, arrowSize, visibleSize, scrollSize, scrollPosition], () => {
    let r = _computeValues(
      oppositeScrollbarSize.value,
      arrowSize.value,
      visibleSize.value,
      scrollSize.value,
      scrollPosition.value,
    );
    _computedAvailableSize.value = r.computedAvailableSize;
    _computedIsNeeded.value = r.computedIsNeeded;
    _computedSliderSize.value = r.computedSliderSize;
    _computedSliderRatio.value = r.computedSliderRatio;
    _computedSliderPosition.value = r.computedSliderPosition;
  });

  /**
   * Compute a desired `scrollPosition` such that `offset` ends up in the center of the slider.
   * `offset` is based on the same coordinate system as the `sliderPosition`.
   */
  function getDesiredScrollPositionFromOffset(offset: MaybeRefOrGetter<number>) {
    return computed(() => {
      if (!_computedIsNeeded.value) {
        // no need for a slider
        return 0;
      }

      const desiredSliderPosition = toValue(offset) - arrowSize.value - _computedSliderSize.value / 2;
      return Math.round(desiredSliderPosition / _computedSliderRatio.value);
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
      if (!_computedIsNeeded.value) {
        // no need for a slider
        return 0;
      }

      const correctedOffset = toValue(offset) - arrowSize.value; // compensate if has arrows
      let desiredScrollPosition = scrollPosition.value;
      if (correctedOffset < _computedSliderPosition.value) {
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
  function getDesiredScrollPositionFromDelta(delta: MaybeRefOrGetter<number>, sliderPosition?: number) {
    return computed(() => {
      if (!_computedIsNeeded.value) {
        // no need for a slider
        return 0;
      }

      const desiredSliderPosition = _computedSliderPosition.value + toValue(delta);
      return Math.round(desiredSliderPosition / _computedSliderRatio.value);
    });
  }

  function clone() {
    const snapshot = {
      scrollPosition: scrollPosition.value,
      // computedAvailableSize: _computedAvailableSize.value,
      computedIsNeeded: _computedIsNeeded.value,
      // computedSliderSize: _computedSliderSize.value,
      computedSliderRatio: _computedSliderRatio.value,
      computedSliderPosition: _computedSliderPosition.value,
    };

    return {
      scrollPosition: snapshot.scrollPosition,
      getDesiredScrollPositionFromDelta(delta: number) {
        if (!snapshot.computedIsNeeded) return 0;
        const desiredSliderPosition = snapshot.computedSliderPosition + delta;
        return Math.round(desiredSliderPosition / snapshot.computedSliderRatio);
      },
    };
  }

  return {
    arrowSize,
    scrollbarSize,
    oppositeScrollbarSize,

    visibleSize,
    scrollSize,
    scrollPosition,

    rectangleLargeSize: computed(() => _computedAvailableSize.value),
    rectangleSmallSize: computed(() => scrollbarSize.value),
    isNeeded: computed(() => _computedIsNeeded.value),
    sliderSize: computed(() => _computedSliderSize.value),
    sliderPosition: computed(() => _computedSliderPosition.value),

    _sliderRadio: computed(() => _computedSliderRatio.value),

    clone,

    getDesiredScrollPositionFromOffset,
    getDesiredScrollPositionFromOffsetPaged,
    getDesiredScrollPositionFromDelta,
  };
}

export type UseScrollbarStateReturn = ReturnType<typeof useScrollbarState>;

function _computeValues(oppositeScrollbarSize: number, arrowSize: number, visibleSize: number, scrollSize: number, scrollPosition: number) {
  const computedAvailableSize = Math.max(0, visibleSize - oppositeScrollbarSize);
  const computedRepresentableSize = Math.max(0, computedAvailableSize - 2 * arrowSize);
  const computedIsNeeded = (scrollSize > 0 && scrollSize > visibleSize);

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
  const computedSliderSize = Math.round(Math.max(MINIMUM_SLIDER_SIZE, Math.floor(visibleSize * computedRepresentableSize / scrollSize)));

  // The slider can move from 0 to `computedRepresentableSize` - `computedSliderSize`
  // in the same way `scrollPosition` can move from 0 to `scrollSize` - `visibleSize`.
  const computedSliderRatio = (computedRepresentableSize - computedSliderSize) / (scrollSize - visibleSize);
  const computedSliderPosition = (scrollPosition * computedSliderRatio);

  return {
    /**
     * `visibleSize` - `oppositeScrollbarSize`
     */
    computedAvailableSize: Math.round(computedAvailableSize),
    /**
     * (`scrollSize` > 0 && `scrollSize` > `visibleSize`)
     */
    computedIsNeeded,
    computedSliderSize: Math.round(computedSliderSize),
    computedSliderRatio,
    computedSliderPosition: Math.round(computedSliderPosition),
  };
}
