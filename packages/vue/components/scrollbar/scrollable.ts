import type { IDisposable } from '../../utils/disposable';
import { scheduleAtNextAnimationFrame } from '../../utils/scheduleAtNextAnimationFrame';
import { useEmit } from '../../hooks/useEmit';
import { toValue, type MaybeRefOrGetter } from '@vueuse/core';
import { computed, readonly, shallowRef } from 'vue-demi';

export const enum ScrollbarVisibility {
  Auto = 1,
  Hidden = 2,
  Visible = 3,
}

export interface ScrollEvent {
  inSmoothScrolling: boolean;

  oldWidth: number;
  oldScrollWidth: number;
  oldScrollLeft: number;

  width: number;
  scrollWidth: number;
  scrollLeft: number;

  oldHeight: number;
  oldScrollHeight: number;
  oldScrollTop: number;

  height: number;
  scrollHeight: number;
  scrollTop: number;

  widthChanged: boolean;
  scrollWidthChanged: boolean;
  scrollLeftChanged: boolean;

  heightChanged: boolean;
  scrollHeightChanged: boolean;
  scrollTopChanged: boolean;
}

export interface IScrollDimensions {
  readonly width: number;
  readonly scrollWidth: number;
  readonly height: number;
  readonly scrollHeight: number;
}
export interface INewScrollDimensions {
  width?: number;
  scrollWidth?: number;
  height?: number;
  scrollHeight?: number;
}

export interface IScrollPosition {
  readonly scrollLeft: number;
  readonly scrollTop: number;
}
export interface ISmoothScrollPosition {
  readonly scrollLeft: number;
  readonly scrollTop: number;

  readonly width: number;
  readonly height: number;
}
export interface INewScrollPosition {
  scrollLeft?: number;
  scrollTop?: number;
}

export class ScrollState implements IScrollDimensions, IScrollPosition {
  _scrollStateBrand: void = undefined;

  public readonly rawScrollLeft: number;
  public readonly rawScrollTop: number;

  public readonly width: number;
  public readonly scrollWidth: number;
  public readonly scrollLeft: number;
  public readonly height: number;
  public readonly scrollHeight: number;
  public readonly scrollTop: number;

  constructor(
    private readonly _forceIntegerValues: boolean,
    width: number,
    scrollWidth: number,
    scrollLeft: number,
    height: number,
    scrollHeight: number,
    scrollTop: number,
  ) {
    if (this._forceIntegerValues) {
      width = width | 0;
      scrollWidth = scrollWidth | 0;
      scrollLeft = scrollLeft | 0;
      height = height | 0;
      scrollHeight = scrollHeight | 0;
      scrollTop = scrollTop | 0;
    }

    this.rawScrollLeft = scrollLeft; // before validation
    this.rawScrollTop = scrollTop; // before validation

    if (width < 0) {
      width = 0;
    }
    if (scrollLeft + width > scrollWidth) {
      scrollLeft = scrollWidth - width;
    }
    if (scrollLeft < 0) {
      scrollLeft = 0;
    }

    if (height < 0) {
      height = 0;
    }
    if (scrollTop + height > scrollHeight) {
      scrollTop = scrollHeight - height;
    }
    if (scrollTop < 0) {
      scrollTop = 0;
    }

    this.width = width;
    this.scrollWidth = scrollWidth;
    this.scrollLeft = scrollLeft;
    this.height = height;
    this.scrollHeight = scrollHeight;
    this.scrollTop = scrollTop;
  }

  public equals(other: ScrollState): boolean {
    return (
      this.rawScrollLeft === other.rawScrollLeft
      && this.rawScrollTop === other.rawScrollTop
      && this.width === other.width
      && this.scrollWidth === other.scrollWidth
      && this.scrollLeft === other.scrollLeft
      && this.height === other.height
      && this.scrollHeight === other.scrollHeight
      && this.scrollTop === other.scrollTop
    );
  }

  public withScrollDimensions(update: INewScrollDimensions, useRawScrollPositions: boolean): ScrollState {
    return new ScrollState(
      this._forceIntegerValues,
      (typeof update.width !== 'undefined' ? update.width : this.width),
      (typeof update.scrollWidth !== 'undefined' ? update.scrollWidth : this.scrollWidth),
      useRawScrollPositions ? this.rawScrollLeft : this.scrollLeft,
      (typeof update.height !== 'undefined' ? update.height : this.height),
      (typeof update.scrollHeight !== 'undefined' ? update.scrollHeight : this.scrollHeight),
      useRawScrollPositions ? this.rawScrollTop : this.scrollTop,
    );
  }

  public withScrollPosition(update: INewScrollPosition): ScrollState {
    return new ScrollState(
      this._forceIntegerValues,
      this.width,
      this.scrollWidth,
      (typeof update.scrollLeft !== 'undefined' ? update.scrollLeft : this.rawScrollLeft),
      this.height,
      this.scrollHeight,
      (typeof update.scrollTop !== 'undefined' ? update.scrollTop : this.rawScrollTop),
    );
  }

  public createScrollEvent(previous: ScrollState, inSmoothScrolling: boolean): ScrollEvent {
    const widthChanged = (this.width !== previous.width);
    const scrollWidthChanged = (this.scrollWidth !== previous.scrollWidth);
    const scrollLeftChanged = (this.scrollLeft !== previous.scrollLeft);

    const heightChanged = (this.height !== previous.height);
    const scrollHeightChanged = (this.scrollHeight !== previous.scrollHeight);
    const scrollTopChanged = (this.scrollTop !== previous.scrollTop);

    return {
      inSmoothScrolling,
      oldWidth: previous.width,
      oldScrollWidth: previous.scrollWidth,
      oldScrollLeft: previous.scrollLeft,

      width: this.width,
      scrollWidth: this.scrollWidth,
      scrollLeft: this.scrollLeft,

      oldHeight: previous.height,
      oldScrollHeight: previous.scrollHeight,
      oldScrollTop: previous.scrollTop,

      height: this.height,
      scrollHeight: this.scrollHeight,
      scrollTop: this.scrollTop,

      widthChanged,
      scrollWidthChanged,
      scrollLeftChanged,

      heightChanged,
      scrollHeightChanged,
      scrollTopChanged,
    };
  }
}

export class SmoothScrollingUpdate {
  public readonly scrollLeft: number;
  public readonly scrollTop: number;
  public readonly isDone: boolean;

  constructor(scrollLeft: number, scrollTop: number, isDone: boolean) {
    this.scrollLeft = scrollLeft;
    this.scrollTop = scrollTop;
    this.isDone = isDone;
  }
}

interface IAnimation {
  (completion: number): number;
}

export class SmoothScrollingOperation {
  public readonly from: ISmoothScrollPosition;
  public to: ISmoothScrollPosition;
  public readonly duration: number;
  public readonly startTime: number;
  public animationFrameDisposable: IDisposable | null;

  private scrollLeft!: IAnimation;
  private scrollTop!: IAnimation;

  constructor(from: ISmoothScrollPosition, to: ISmoothScrollPosition, startTime: number, duration: number) {
    this.from = from;
    this.to = to;
    this.duration = duration;
    this.startTime = startTime;

    this.animationFrameDisposable = null;

    this._initAnimations();
  }

  private _initAnimations(): void {
    this.scrollLeft = this._initAnimation(this.from.scrollLeft, this.to.scrollLeft, this.to.width);
    this.scrollTop = this._initAnimation(this.from.scrollTop, this.to.scrollTop, this.to.height);
  }

  private _initAnimation(from: number, to: number, viewportSize: number): IAnimation {
    const delta = Math.abs(from - to);
    if (delta > 2.5 * viewportSize) {
      let stop1: number, stop2: number;
      if (from < to) {
        // scroll to 75% of the viewportSize
        stop1 = from + 0.75 * viewportSize;
        stop2 = to - 0.75 * viewportSize;
      } else {
        stop1 = from - 0.75 * viewportSize;
        stop2 = to + 0.75 * viewportSize;
      }
      return createComposed(createEaseOutCubic(from, stop1), createEaseOutCubic(stop2, to), 0.33);
    }
    return createEaseOutCubic(from, to);
  }

  public dispose(): void {
    if (this.animationFrameDisposable !== null) {
      this.animationFrameDisposable.dispose();
      this.animationFrameDisposable = null;
    }
  }

  public acceptScrollDimensions(state: ScrollState): void {
    this.to = state.withScrollPosition(this.to);
    this._initAnimations();
  }

  public tick(): SmoothScrollingUpdate {
    return this._tick(Date.now());
  }

  protected _tick(now: number): SmoothScrollingUpdate {
    const completion = (now - this.startTime) / this.duration;

    if (completion < 1) {
      const newScrollLeft = this.scrollLeft(completion);
      const newScrollTop = this.scrollTop(completion);
      return new SmoothScrollingUpdate(newScrollLeft, newScrollTop, false);
    }

    return new SmoothScrollingUpdate(this.to.scrollLeft, this.to.scrollTop, true);
  }

  public combine(from: ISmoothScrollPosition, to: ISmoothScrollPosition, duration: number): SmoothScrollingOperation {
    return SmoothScrollingOperation.start(from, to, duration);
  }

  public static start(from: ISmoothScrollPosition, to: ISmoothScrollPosition, duration: number): SmoothScrollingOperation {
    // +10 / -10 : pretend the animation already started for a quicker response to a scroll request
    duration = duration + 10;
    const startTime = Date.now() - 10;

    return new SmoothScrollingOperation(from, to, startTime, duration);
  }
}

function createEaseOutCubic(from: number, to: number): IAnimation {
  const delta = to - from;
  return function (completion: number): number {
    return from + delta * easeOutCubic(completion);
  };
}

function createComposed(a: IAnimation, b: IAnimation, cut: number): IAnimation {
  return function (completion: number): number {
    if (completion < cut) {
      return a(completion / cut);
    }
    return b((completion - cut) / (1 - cut));
  };
}

function easeInCubic(t: number) {
  return t ** 3;
}

function easeOutCubic(t: number) {
  return 1 - easeInCubic(1 - t);
}

export function useScrollable(
  rawSmoothScrollDuration: MaybeRefOrGetter<number>,
  forceIntegerValues: MaybeRefOrGetter<boolean>,
) {
  const emit = useEmit();

  const smoothScrollDuration = computed(() => toValue(rawSmoothScrollDuration));
  const state = shallowRef(new ScrollState(toValue(forceIntegerValues), 0, 0, 0, 0, 0, 0));
  const smoothScrolling = shallowRef<SmoothScrollingOperation | null>(null);

  function validateScrollPosition(scrollPosition: INewScrollPosition): INewScrollPosition {
    return state.value.withScrollPosition(scrollPosition);
  }

  function _setState(newState: ScrollState, inSmoothScrolling: boolean): void {
    const oldState = state.value;
    if (oldState.equals(newState)) {
      // no change
      return;
    }
    state.value = newState;
    emit?.('scroll', state.value.createScrollEvent(oldState, inSmoothScrolling));
  }

  function getScrollDimensions(): IScrollDimensions {
    return state.value;
  }

  function setScrollDimensions(dimensions: INewScrollDimensions, useRawScrollPositions: boolean): void {
    const newState = state.value.withScrollDimensions(dimensions, useRawScrollPositions);
    _setState(newState, Boolean(smoothScrolling.value));

    // Validate outstanding animated scroll position target
    smoothScrolling.value?.acceptScrollDimensions(state.value);
  }

  function getFutureScrollPosition(): IScrollPosition {
    if (smoothScrolling.value) {
      return smoothScrolling.value.to;
    }
    return state.value;
  }

  function getCurrentScrollPosition(): IScrollPosition {
    return state.value;
  }

  function setScrollPositionNow(update: INewScrollPosition): void {
    // no smooth scrolling requested
    const newState = state.value.withScrollPosition(update);

    // Terminate any outstanding smooth scrolling
    if (smoothScrolling.value) {
      smoothScrolling.value.dispose();
      smoothScrolling.value = null;
    }

    _setState(newState, false);
  }

  function _performSmoothScrolling(): void {
    if (!smoothScrolling.value) {
      return;
    }
    const update = smoothScrolling.value.tick();
    const newState = state.value.withScrollPosition(update);

    _setState(newState, true);

    if (!smoothScrolling.value) {
      // Looks like someone canceled the smooth scrolling
      // from the scroll event handler
      return;
    }

    if (update.isDone) {
      smoothScrolling.value.dispose();
      smoothScrolling.value = null;
      return;
    }

    // Continue smooth scrolling animation
    smoothScrolling.value.animationFrameDisposable = scheduleAtNextAnimationFrame(() => {
      if (!smoothScrolling.value) {
        return;
      }
      smoothScrolling.value.animationFrameDisposable = null;
      _performSmoothScrolling();
    });
  }

  function setScrollPositionSmooth(update: INewScrollPosition, reuseAnimation?: boolean): void {
    if (smoothScrollDuration.value === 0) {
      // Smooth scrolling not supported.
      return setScrollPositionNow(update);
    }

    if (smoothScrolling.value) {
      // Combine our pending scrollLeft/scrollTop with incoming scrollLeft/scrollTop
      update = {
        scrollLeft: (typeof update.scrollLeft === 'undefined' ? smoothScrolling.value.to.scrollLeft : update.scrollLeft),
        scrollTop: (typeof update.scrollTop === 'undefined' ? smoothScrolling.value.to.scrollTop : update.scrollTop),
      };

      // Validate `update`
      const validTarget = state.value.withScrollPosition(update);

      if (smoothScrolling.value.to.scrollLeft === validTarget.scrollLeft && smoothScrolling.value.to.scrollTop === validTarget.scrollTop) {
        // No need to interrupt or extend the current animation since we're going to the same place
        return;
      }
      let newSmoothScrolling: SmoothScrollingOperation;
      if (reuseAnimation) {
        newSmoothScrolling = new SmoothScrollingOperation(smoothScrolling.value.from, validTarget, smoothScrolling.value.startTime, smoothScrolling.value.duration);
      } else {
        newSmoothScrolling = smoothScrolling.value.combine(state.value, validTarget, smoothScrollDuration.value);
      }
      smoothScrolling.value.dispose();
      smoothScrolling.value = newSmoothScrolling;
    } else {
      // Validate `update`
      const validTarget = state.value.withScrollPosition(update);

      smoothScrolling.value = SmoothScrollingOperation.start(state.value, validTarget, smoothScrollDuration.value);
    }

    // Begin smooth scrolling animation
    smoothScrolling.value.animationFrameDisposable = scheduleAtNextAnimationFrame(() => {
      if (!smoothScrolling.value) {
        return;
      }
      smoothScrolling.value.animationFrameDisposable = null;
      _performSmoothScrolling();
    });
  }

  return {
    state: readonly(state),
    validateScrollPosition,
    getScrollDimensions,
    setScrollDimensions,
    getFutureScrollPosition,
    getCurrentScrollPosition,
    setScrollPositionNow,
    setScrollPositionSmooth,
  };
}
