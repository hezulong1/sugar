import type { IDisposable } from '../../utils/disposable';
import { toValue, type MaybeRefOrGetter, tryOnScopeDispose } from '@vueuse/core';
import type { Ref } from 'vue-demi';
import { computed, ref, shallowRef, watch, watchEffect } from 'vue-demi';

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

export function useScrollState(
  _forceIntegerValues: MaybeRefOrGetter<boolean>,
  widthMaybeRef: MaybeRefOrGetter<number>,
  scrollWidthMaybeRef: MaybeRefOrGetter<number>,
  scrollLeftMaybeRef: MaybeRefOrGetter<number>,
  heightMaybeRef: MaybeRefOrGetter<number>,
  scrollHeightMaybeRef: MaybeRefOrGetter<number>,
  scrollTopMaybeRef: MaybeRefOrGetter<number>,
) {
  let rawScrollLeft = 0;
  let rawScrollTop = 0;

  function update() {
    let width = toValue(widthMaybeRef);
    let scrollWidth = toValue(scrollWidthMaybeRef);
    let scrollLeft = toValue(scrollLeftMaybeRef);
    let height = toValue(heightMaybeRef);
    let scrollHeight = toValue(scrollHeightMaybeRef);
    let scrollTop = toValue(scrollTopMaybeRef);

    if (toValue(_forceIntegerValues)) {
      width = width | 0;
      scrollWidth = scrollWidth | 0;
      scrollLeft = scrollLeft | 0;
      height = height | 0;
      scrollHeight = scrollHeight | 0;
      scrollTop = scrollTop | 0;
    }

    rawScrollLeft = scrollLeft;
    rawScrollTop = scrollTop;

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

    return [width, scrollWidth, scrollLeft, height, scrollHeight, scrollTop];
  }

  const [width, scrollWidth, scrollLeft, height, scrollHeight, scrollTop] = update();

  const scrollEvent = ref({
    oldWidth: 0,
    oldScrollWidth: 0,
    oldScrollLeft: 0,

    width,
    scrollWidth,
    scrollLeft,

    widthChanged: false,
    scrollWidthChanged: false,
    scrollLeftChanged: false,

    oldHeight: 0,
    oldScrollHeight: 0,
    oldScrollTop: 0,

    height,
    scrollHeight,
    scrollTop,

    heightChanged: false,
    scrollHeightChanged: false,
    scrollTopChanged: false,
  });

  watchEffect(() => {
    const {
      width: oldWidth, scrollWidth: oldScrollWidth, scrollLeft: oldScrollLeft,
      height: oldHeight, scrollHeight: oldScrollHeight, scrollTop: oldScrollTop,
    } = scrollEvent.value;

    const oldRawScrollLeft = rawScrollLeft;
    const oldRawScrollTop = rawScrollTop;

    const [width, scrollWidth, scrollLeft, height, scrollHeight, scrollTop] = update();

    if (
      oldRawScrollLeft === rawScrollLeft && oldRawScrollTop === rawScrollTop &&
      oldWidth === width && oldScrollWidth === scrollWidth && oldScrollLeft === scrollLeft &&
      oldHeight === height && oldScrollHeight === scrollHeight && oldScrollTop === scrollTop
    ) return;

    scrollEvent.value = {
      oldWidth,
      oldScrollWidth,
      oldScrollLeft,

      width,
      scrollWidth,
      scrollLeft,

      widthChanged: oldWidth !== width,
      scrollWidthChanged: oldScrollWidth !== scrollWidth,
      scrollLeftChanged: oldScrollLeft !== scrollLeft,

      oldHeight,
      oldScrollHeight,
      oldScrollTop,

      height,
      scrollHeight,
      scrollTop,

      heightChanged: oldHeight !== height,
      scrollHeightChanged: oldScrollHeight !== scrollHeight,
      scrollTopChanged: oldScrollTop !== scrollTop,
    };
  });

  return {
    rawScrollLeft,
    rawScrollTop,
    scrollEvent: computed(() => scrollEvent.value),
  };
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

function easeInCubic(t: number) {
  return t ** 3;
}

function easeOutCubic(t: number) {
  return 1 - easeInCubic(1 - t);
}

interface IAnimation {
  (completion: number): number;
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

function initAnimation(from: number, to: number, viewportSize: number): IAnimation {
  const delta = Math.abs(from - to);
  if (delta > 2.5 * viewportSize) {
    let stop1, stop2;
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

export function useSmoothScrolling(
  from: Ref<ISmoothScrollPosition>,
  to: Ref<ISmoothScrollPosition>,
  startTime: MaybeRefOrGetter<number>,
  duration: MaybeRefOrGetter<number>,
) {
  const _startTime = computed(() => toValue(startTime) - 10);
  const _duration = computed(() => toValue(duration) + 10);

  const scrollLeft = computed(() => initAnimation(from.value.scrollLeft, to.value.scrollLeft, to.value.width));
  const scrollTop = computed(() => initAnimation(from.value.scrollTop, to.value.scrollTop, to.value.height));

  function _tick(now: number) {
    const completion = (now - _startTime.value) / _duration.value;

    if (completion < 1) {
      const newScrollLeft = scrollLeft.value(completion);
      const newScrollTop = scrollTop.value(completion);
      return new SmoothScrollingUpdate(newScrollLeft, newScrollTop, false);
    }

    return new SmoothScrollingUpdate(to.value.scrollLeft, to.value.scrollTop, true);
  }

  return () => _tick(Date.now());
}

class AnimationFrameQueueItem {
  private _runner: () => void;
  private _canceled: boolean;

  constructor(runner: () => void) {
    this._runner = runner;
    this._canceled = false;
  }

  public dispose(): void {
    this._canceled = true;
  }

  public execute(): void {
    if (this._canceled) {
      return;
    }

    try {
      this._runner();
    } catch (e) {
      // onUnexpectedError(e)
    }
  }
}

let NEXT_QUEUE: AnimationFrameQueueItem[] = [];
let CURRENT_QUEUE: AnimationFrameQueueItem[] | null = null;
let animFrameRequested = false;

const animationFrameRunner = () => {
  animFrameRequested = false;

  CURRENT_QUEUE = NEXT_QUEUE;
  NEXT_QUEUE = [];

  while (CURRENT_QUEUE.length > 0) {
    const top = CURRENT_QUEUE.shift()!;
    top.execute();
  }
};

export function raf(runner: VoidFunction) {
  const item = new AnimationFrameQueueItem(runner);
  NEXT_QUEUE.push(item);

  if (!animFrameRequested) {
    animFrameRequested = true;
    requestAnimationFrame(animationFrameRunner);
  }

  return () => item.dispose();
}

export function useScrollable(
  onScroll: (e: ScrollEvent) => void,
  _forceIntegerValues: boolean,
  _smoothScrollDurationRef: MaybeRefOrGetter<number>,
  _widthRef: MaybeRefOrGetter<number>,
  _scrollWidthRef: MaybeRefOrGetter<number>,
  _scrollLeftRef: MaybeRefOrGetter<number>,
  _heightRef: MaybeRefOrGetter<number>,
  _scrollHeightRef: MaybeRefOrGetter<number>,
  _scrollTopRef: MaybeRefOrGetter<number>,
) {
  const smoothScrollDurationRef = computed(() => toValue(_smoothScrollDurationRef));

  const widthRef = computed(() => toValue(_widthRef));
  const scrollWidthRef = computed(() => toValue(_scrollWidthRef));
  const scrollLeftRef = ref(toValue(_scrollLeftRef));

  const heightRef = computed(() => toValue(_heightRef));
  const scrollHeightRef = computed(() => toValue(_scrollHeightRef));
  const scrollTopRef = ref(toValue(_scrollTopRef));

  const { scrollEvent } = useScrollState(
    _forceIntegerValues,
    widthRef,
    scrollWidthRef,
    scrollLeftRef,
    heightRef,
    scrollHeightRef,
    scrollTopRef,
  );

  function setScrollPositionNow(update: INewScrollPosition) {
    if (typeof update.scrollLeft === 'number') {
      scrollLeftRef.value = update.scrollLeft;
    }

    if (typeof update.scrollTop === 'number') {
      scrollTopRef.value = update.scrollTop;
    }
  }

  const _from = ref<ISmoothScrollPosition>({
    scrollLeft: scrollEvent.value.scrollLeft,
    scrollTop: scrollEvent.value.scrollTop,
    width: scrollEvent.value.width,
    height: scrollEvent.value.height,
  });

  const _to = ref<ISmoothScrollPosition>({
    scrollLeft: scrollEvent.value.scrollLeft,
    scrollTop: scrollEvent.value.scrollTop,
    width: scrollEvent.value.width,
    height: scrollEvent.value.height,
  });
  const startTime = ref<number>(Date.now());
  const inSmoothScrolling = ref(false);
  const smoothScrollingTick = useSmoothScrolling(_from, _to, startTime, smoothScrollDurationRef);
  // const rafController = useRafFn(() => _performSmoothScrolling(), { immediate: false });
  let stopRaf: VoidFunction | null = null;

  function setScrollPositionSmooth(update: INewScrollPosition) {
    if (smoothScrollDurationRef.value === 0) {
      return setScrollPositionNow(update);
    }

    if (stopRaf) {
      update = {
        scrollLeft: typeof update.scrollLeft === 'undefined' ? scrollLeftRef.value : update.scrollLeft,
        scrollTop: typeof update.scrollTop === 'undefined' ? scrollTopRef.value : update.scrollTop,
      };

      console.log('存在', { ...update });

      if (_to.value.scrollLeft === update.scrollLeft && _to.value.scrollTop === update.scrollTop) return;

      _to.value = {
        scrollLeft: update.scrollLeft!,
        scrollTop: update.scrollTop!,
        width: _to.value.width,
        height: _to.value.height,
      };

      startTime.value = Date.now();

      stopRaf();

      // inSmoothScrolling.value = true;
    } else {
      console.log('新', { ...update });

      _to.value = {
        scrollLeft: typeof update.scrollLeft === 'number' ? update.scrollLeft : _to.value.scrollLeft,
        scrollTop: typeof update.scrollTop === 'number' ? update.scrollTop : _to.value.scrollTop,
        width: _to.value.width,
        height: _to.value.height,
      };

      startTime.value = Date.now();

      // inSmoothScrolling.value = true;
    }

    inSmoothScrolling.value = true;
    stopRaf = raf(() => {
      stopRaf = null;
      _performSmoothScrolling();
    });
  }

  function _performSmoothScrolling() {
    if (!inSmoothScrolling.value) return;

    const update = smoothScrollingTick();

    scrollTopRef.value = update.scrollTop;
    scrollLeftRef.value = update.scrollLeft;

    if (update.isDone) {
      inSmoothScrolling.value = false;
      if (stopRaf) {
        stopRaf();
        stopRaf = null;
      }
      return;
    }

    stopRaf = raf(() => {
      stopRaf = null;
      _performSmoothScrolling();
    });
  }

  function didScroll(update: INewScrollPosition) {
    smoothScrollDurationRef.value === 0 ? setScrollPositionNow(update) : setScrollPositionSmooth(update);
  }

  function getFutureScrollPosition(): IScrollPosition {
    return { ..._to.value };
  }

  function validateScrollPosition(scrollPosition: INewScrollPosition): IScrollPosition {
    return {
      scrollLeft: typeof scrollPosition.scrollLeft === 'undefined' ? scrollEvent.value.scrollLeft : scrollPosition.scrollLeft,
      scrollTop: typeof scrollPosition.scrollTop === 'undefined' ? scrollEvent.value.scrollTop : scrollPosition.scrollTop,
    };
  }

  watch(scrollEvent, (e) => {
    onScroll?.({ ...e, inSmoothScrolling: inSmoothScrolling.value });
  });

  return {
    didScroll,
    getFutureScrollPosition,
    validateScrollPosition,
  };
}
