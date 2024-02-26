import { toValue, computed, ref, watchEffect, watch } from 'vue';
import type { Ref, type MaybeRefOrGetter, reactive, UnwrapRef } from 'vue';

export interface UseTestOptions {
  msg: MaybeRefOrGetter<string>;
  width: MaybeRefOrGetter<number>;
  integer: MaybeRefOrGetter<boolean>;
}

function useWrap(s: MaybeRefOrGetter<string>) {
  return computed(() => toValue(s) + '::suffix');
}

export function useTest(n: MaybeRefOrGetter<number>, opts: UseTestOptions) {
  const width = computed(() => toValue(opts.integer) ? (toValue(n) | 0) : toValue(opts.width));
  const w2 = ref(-1);
  watchEffect(() => {
    console.log(1111);
    w2.value = width.value * 2;
  });
  return {
    w2,
    msg: useWrap(opts.msg),
  };
}

export function useScrollState(
  _forceIntegerValues: MaybeRefOrGetter<boolean>,
  widthMaybeRef: MaybeRefOrGetter<number>,
  scrollWidthMaybeRef: MaybeRefOrGetter<number>,
  scrollLeftMaybeRef: MaybeRefOrGetter<number>,
) {
  let rawScrollLeft = 0;

  function update() {
    let width = toValue(widthMaybeRef);
    let scrollWidth = toValue(scrollWidthMaybeRef);
    let scrollLeft = toValue(scrollLeftMaybeRef);

    if (toValue(_forceIntegerValues)) {
      width = width | 0;
      scrollWidth = scrollWidth | 0;
      scrollLeft = scrollLeft | 0;
    }

    rawScrollLeft = scrollLeft;

    if (width < 0) {
      width = 0;
    }
    if (scrollLeft + width > scrollWidth) {
      scrollLeft = scrollWidth - width;
    }
    if (scrollLeft < 0) {
      scrollLeft = 0;
    }

    return [width, scrollWidth, scrollLeft];
  }

  const [width, scrollWidth, scrollLeft] = update();

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
  });

  watchEffect(() => {
    const { width: oldWidth, scrollWidth: oldScrollWidth, scrollLeft: oldScrollLeft } = scrollEvent.value;
    const [width, scrollWidth, scrollLeft] = update();

    if (oldWidth === width && oldScrollWidth === scrollWidth && oldScrollLeft === scrollLeft) return;

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
    };
  });

  return {
    rawScrollLeft,
    scrollEvent: computed(() => scrollEvent),
  };
}

type UseScrollStateReturn = ReturnType<typeof useScrollState>;
type ScrollEvent = UnwrapRef<UnwrapRef<UseScrollStateReturn['scrollEvent']>>;

export interface ISmoothScrollPosition {
  readonly scrollLeft: number;
  readonly scrollTop: number;

  readonly width: number;
  readonly height: number;
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

export interface INewScrollPosition {
  scrollLeft?: number;
  scrollTop?: number;
}

export function useScrollable(
  onScroll: (e: ScrollEvent) => void,
  _forceIntegerValues: boolean,
  smoothScrollDuration: MaybeRefOrGetter<number>,
  width: Ref<number>,
  scrollWidth: Ref<number>,
  scrollLeft: Ref<number>,
) {
  const widthRef = computed(() => width.value);
  const scrollWidthRef = computed(() => scrollWidth.value);
  const scrollLeftRef = ref(scrollLeft.value);

  const { scrollEvent } = useScrollState(
    _forceIntegerValues,
    widthRef,
    scrollWidthRef,
    scrollLeftRef,
  );

  function setScrollPositionNow(update: INewScrollPosition) {

  }

  function setScrollPositionSmooth(update: INewScrollPosition) {

  }

  function trigger(update: INewScrollPosition) {
    if (typeof update.scrollLeft === 'undefined') return;
    smoothScrollDuration === 0 ? setScrollPositionNow(update) : setScrollPositionSmooth(update);
  }

  watch(scrollEvent, () => {
    onScroll?.(scrollEvent.value.value);
  });

  return trigger;
}
