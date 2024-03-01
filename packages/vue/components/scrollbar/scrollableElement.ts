import type { INewScrollDimensions, INewScrollPosition, ScrollEvent, Scrollable, ScrollbarVisibility } from './scrollable';
import type { IMouseEvent, IMouseWheelEvent } from '../../utils/mouseEvent';
import { StandardWheelEvent } from '../../utils/mouseEvent';

import { getWindow } from '../../utils/dom';
import { isLinux, isMacintosh, isWindows } from '../../utils/platform';
import type { SetupContext } from 'vue-demi';
import { computed, ref } from 'vue-demi';
import type { ScrollbarInstance } from './scrollbar';
import type { MaybeRefOrGetter } from '@vueuse/core';
import { toValue, tryOnScopeDispose, useTimeoutFn } from '@vueuse/core';

export const HIDE_TIMEOUT = 500;
export const SCROLL_WHEEL_SENSITIVITY = 50;
export const SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED = true;

class MouseWheelClassifierItem {
  public timestamp: number;
  public deltaX: number;
  public deltaY: number;
  public score: number;

  constructor(timestamp: number, deltaX: number, deltaY: number) {
    this.timestamp = timestamp;
    this.deltaX = deltaX;
    this.deltaY = deltaY;
    this.score = 0;
  }
}

export class MouseWheelClassifier {
  public static readonly INSTANCE = new MouseWheelClassifier();

  private readonly _capacity: number;
  private _memory: MouseWheelClassifierItem[];
  private _front: number;
  private _rear: number;

  constructor() {
    this._capacity = 5;
    this._memory = [];
    this._front = -1;
    this._rear = -1;
  }

  public isPhysicalMouseWheel(): boolean {
    if (this._front === -1 && this._rear === -1) {
      // no elements
      return false;
    }

    // 0.5 * last + 0.25 * 2nd last + 0.125 * 3rd last + ...
    let remainingInfluence = 1;
    let score = 0;
    let iteration = 1;

    let index = this._rear;
    do {
      const influence = (index === this._front ? remainingInfluence : 2 ** -iteration);
      remainingInfluence -= influence;
      score += this._memory[index].score * influence;

      if (index === this._front) {
        break;
      }

      index = (this._capacity + index - 1) % this._capacity;
      iteration++;
    } while (true);

    return (score <= 0.5);
  }

  public acceptStandardWheelEvent(e: StandardWheelEvent): void {
    const osZoomFactor = getWindow(e.browserEvent).devicePixelRatio / 1;
    if (isWindows || isLinux) {
      // On Windows and Linux, the incoming delta events are multiplied with the OS zoom factor.
      // The OS zoom factor can be reverse engineered by using the device pixel ratio and the configured zoom factor into account.
      this.accept(Date.now(), e.deltaX / osZoomFactor, e.deltaY / osZoomFactor);
    } else {
      this.accept(Date.now(), e.deltaX, e.deltaY);
    }
  }

  public accept(timestamp: number, deltaX: number, deltaY: number): void {
    const item = new MouseWheelClassifierItem(timestamp, deltaX, deltaY);
    item.score = this._computeScore(item);

    if (this._front === -1 && this._rear === -1) {
      this._memory[0] = item;
      this._front = 0;
      this._rear = 0;
    } else {
      this._rear = (this._rear + 1) % this._capacity;
      if (this._rear === this._front) {
        // Drop oldest
        this._front = (this._front + 1) % this._capacity;
      }
      this._memory[this._rear] = item;
    }
  }

  /**
   * A score between 0 and 1 for `item`.
   *  - a score towards 0 indicates that the source appears to be a physical mouse wheel
   *  - a score towards 1 indicates that the source appears to be a touchpad or magic mouse, etc.
   */
  private _computeScore(item: MouseWheelClassifierItem): number {
    if (Math.abs(item.deltaX) > 0 && Math.abs(item.deltaY) > 0) {
      // both axes exercised => definitely not a physical mouse wheel
      return 1;
    }

    let score: number = 0.5;
    const prev = (this._front === -1 && this._rear === -1 ? null : this._memory[this._rear]);
    if (prev) {
      // const deltaT = item.timestamp - prev.timestamp;
      // if (deltaT < 1000 / 30) {
      //   // sooner than X times per second => indicator that this is not a physical mouse wheel
      //   score += 0.25;
      // }

      // if (item.deltaX === prev.deltaX && item.deltaY === prev.deltaY) {
      //   // equal amplitude => indicator that this is a physical mouse wheel
      //   score -= 0.25;
      // }
    }

    if (!this._isAlmostInt(item.deltaX) || !this._isAlmostInt(item.deltaY)) {
      // non-integer deltas => indicator that this is not a physical mouse wheel
      score += 0.25;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  private _isAlmostInt(value: number): boolean {
    const delta = Math.abs(Math.round(value) - value);
    return (delta < 0.01);
  }
}

export interface ScrollableElementOptions {
  /**
   * The scrollable element should not do any DOM mutations until renderNow() is called.
   * Defaults to false.
   */
  lazyRender?: boolean;
  /**
   * Drop subtle horizontal and vertical shadows.
   * Defaults to false.
   */
  useShadows?: boolean;
  /**
   * Handle mouse wheel (listen to mouse wheel scrolling).
   * Defaults to true
   */
  handleMouseWheel?: boolean;
  /**
   * If mouse wheel is handled, make mouse wheel scrolling smooth.
   * Defaults to true.
   */
  mouseWheelSmoothScroll?: boolean;
  /**
   * Flip axes. Treat vertical scrolling like horizontal and vice-versa.
   * Defaults to false.
   */
  flipAxes?: boolean;
  /**
   * If enabled, will scroll horizontally when scrolling vertical.
   * Defaults to false.
   */
  scrollYToX?: boolean;
  /**
   * Consume all mouse wheel events if a scrollbar is needed (i.e. scrollSize > size).
   * Defaults to false.
   */
  consumeMouseWheelIfScrollbarIsNeeded?: boolean;
  /**
   * Always consume mouse wheel events, even when scrolling is no longer possible.
   * Defaults to false.
   */
  alwaysConsumeMouseWheel?: boolean;
  /**
   * A multiplier to be used on the `deltaX` and `deltaY` of mouse wheel scroll events.
   * Defaults to 1.
   */
  mouseWheelScrollSensitivity?: number;
  /**
   * FastScrolling mulitplier speed when pressing `Alt`
   * Defaults to 5.
   */
  fastScrollSensitivity?: number;
  /**
   * Whether the scrollable will only scroll along the predominant axis when scrolling both
   * vertically and horizontally at the same time.
   * Prevents horizontal drift when scrolling vertically on a trackpad.
   * Defaults to true.
   */
  scrollPredominantAxis?: boolean;
  /**
   * Height for vertical arrows (top/bottom) and width for horizontal arrows (left/right).
   * Defaults to 11.
   */
  arrowSize?: number;
  /**
   * The dom node events should be bound to.
   * If no listenOnDomNode is provided, the dom node passed to the constructor will be used for event listening.
   */
  listenOnDomNode?: HTMLElement;
  /**
   * Control the visibility of the horizontal scrollbar.
   * Accepted values: 'auto' (on mouse over), 'visible' (always visible), 'hidden' (never visible)
   * Defaults to 'auto'.
   */
  horizontal?: ScrollbarVisibility;
  /**
   * Height (in px) of the horizontal scrollbar.
   * Defaults to 10.
   */
  horizontalScrollbarSize?: number;
  /**
   * Height (in px) of the horizontal scrollbar slider.
   * Defaults to `horizontalScrollbarSize`
   */
  horizontalSliderSize?: number;
  /**
   * Render arrows (left/right) for the horizontal scrollbar.
   * Defaults to false.
   */
  horizontalHasArrows?: boolean;
  /**
   * Control the visibility of the vertical scrollbar.
   * Accepted values: 'auto' (on mouse over), 'visible' (always visible), 'hidden' (never visible)
   * Defaults to 'auto'.
   */
  vertical?: ScrollbarVisibility;
  /**
   * Width (in px) of the vertical scrollbar.
   * Defaults to 10.
   */
  verticalScrollbarSize?: number;
  /**
   * Width (in px) of the vertical scrollbar slider.
   * Defaults to `verticalScrollbarSize`
   */
  verticalSliderSize?: number;
  /**
   * Render arrows (top/bottom) for the vertical scrollbar.
   * Defaults to false.
   */
  verticalHasArrows?: boolean;
  /**
   * Scroll gutter clicks move by page vs. jump to position.
   * Defaults to false.
   */
  scrollByPage?: boolean;

  revealOnScroll?: boolean;
  scrollable: Scrollable;
}

export interface ScrollableElementEmits {
  (type: 'scroll', event: ScrollEvent): void;
}

export interface ScrollableElementInstance {
  setScrollDimensions(dimension: INewScrollDimensions, useRawScrollPosition?: boolean): void;
}

export interface UseScrollableElementOptions {
  scrollable: Scrollable;

  lazyRender?: MaybeRefOrGetter<boolean>;

  /**
   * Drop subtle horizontal and vertical shadows.
   * Defaults to false.
   */
  useShadows?: boolean;
  // handleMouseWheel?: boolean;
  mouseWheelSmoothScroll?: MaybeRefOrGetter<boolean>;
  flipAxes?: MaybeRefOrGetter<boolean>;
  scrollYToX?: MaybeRefOrGetter<boolean>;
  /**
   * Consume all mouse wheel events if a scrollbar is needed (i.e. scrollSize > size).
   * Defaults to false.
   */
  consumeMouseWheelIfScrollbarIsNeeded?: MaybeRefOrGetter<boolean>;
  /**
   * Always consume mouse wheel events, even when scrolling is no longer possible.
   * Defaults to false.
   */
  alwaysConsumeMouseWheel?: MaybeRefOrGetter<boolean>;
  mouseWheelScrollSensitivity?: MaybeRefOrGetter<number>;
  fastScrollSensitivity?: MaybeRefOrGetter<number>;
  scrollPredominantAxis?: MaybeRefOrGetter<boolean>;

  revealOnScroll?: boolean;
}

export interface UseScrollableElementEmits {
  scroll(event: ScrollEvent): void;
}

export function useScrollableElement(opts: UseScrollableElementOptions, emit: SetupContext<UseScrollableElementEmits>['emit']) {
  const shouldRender = ref(true);
  const isDragging = ref(false);
  const mouseIsOver = ref(false);
  const leftShadowClassName = ref('');
  const topShadowClassName = ref('');
  const topLeftShadowClassName = ref('');
  const hideTimeout = useTimeoutFn(_hide, HIDE_TIMEOUT, { immediate: false });

  const verticalScrollbar = ref<ScrollbarInstance>();
  const horizontalScrollbar = ref<ScrollbarInstance>();

  const { scrollable } = opts;
  const lazyRender = computed(() => toValue(opts.lazyRender));
  const mouseWheelSmoothScroll = computed(() => typeof opts.mouseWheelSmoothScroll !== 'undefined' ? toValue(opts.mouseWheelSmoothScroll) : true);
  const flipAxes = computed(() => typeof opts.flipAxes !== 'undefined' ? toValue(opts.flipAxes) : false);
  const scrollYToX = computed(() => typeof opts.scrollYToX !== 'undefined' ? toValue(opts.scrollYToX) : false);
  const consumeMouseWheelIfScrollbarIsNeeded = computed(() => typeof opts.consumeMouseWheelIfScrollbarIsNeeded !== 'undefined' ? toValue(opts.consumeMouseWheelIfScrollbarIsNeeded) : false);
  const alwaysConsumeMouseWheel = computed(() => typeof opts.alwaysConsumeMouseWheel !== 'undefined' ? toValue(opts.alwaysConsumeMouseWheel) : false);
  const mouseWheelScrollSensitivity = computed(() => typeof opts.mouseWheelScrollSensitivity !== 'undefined' ? toValue(opts.mouseWheelScrollSensitivity) : 1);
  const fastScrollSensitivity = computed(() => typeof opts.fastScrollSensitivity !== 'undefined' ? toValue(opts.fastScrollSensitivity) : 5);
  const scrollPredominantAxis = computed(() => typeof opts.scrollPredominantAxis !== 'undefined' ? toValue(opts.scrollPredominantAxis) : true);

  const useShadows = typeof opts.useShadows !== 'undefined' ? opts.useShadows : false;
  const revealOnScroll = typeof opts.revealOnScroll !== 'undefined' ? opts.revealOnScroll : true;

  scrollable.onScroll(_onDidScroll);

  tryOnScopeDispose(() => {
    scrollable.dispose();
  });

  function _onMouseWheel(e: StandardWheelEvent): void {
    if (e.browserEvent?.defaultPrevented) {
      return;
    }

    const classifier = MouseWheelClassifier.INSTANCE;
    if (SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED) {
      classifier.acceptStandardWheelEvent(e);
    }

    // console.log(`${Date.now()}, ${e.deltaY}, ${e.deltaX}`);

    let didScroll = false;

    if (e.deltaY || e.deltaX) {
      let deltaY = e.deltaY * mouseWheelScrollSensitivity.value;
      let deltaX = e.deltaX * mouseWheelScrollSensitivity.value;

      if (scrollPredominantAxis.value) {
        if (scrollYToX.value && deltaX + deltaY === 0) {
          // when configured to map Y to X and we both see
          // no dominant axis and X and Y are competing with
          // identical values into opposite directions, we
          // ignore the delta as we cannot make a decision then
          deltaX = 0;
          deltaY = 0;
        } else if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          deltaX = 0;
        } else {
          deltaY = 0;
        }
      }

      if (flipAxes.value) {
        [deltaY, deltaX] = [deltaX, deltaY];
      }

      // Convert vertical scrolling to horizontal if shift is held, this
      // is handled at a higher level on Mac
      const shiftConvert = !isMacintosh && e.browserEvent && e.browserEvent.shiftKey;
      if ((scrollYToX.value || shiftConvert) && !deltaX) {
        deltaX = deltaY;
        deltaY = 0;
      }

      if (e.browserEvent && e.browserEvent.altKey) {
        // fastScrolling
        deltaX = deltaX * fastScrollSensitivity.value;
        deltaY = deltaY * fastScrollSensitivity.value;
      }

      const futureScrollPosition = scrollable.getFutureScrollPosition();

      let desiredScrollPosition: INewScrollPosition = {};
      if (deltaY) {
        const deltaScrollTop = SCROLL_WHEEL_SENSITIVITY * deltaY;
        // Here we convert values such as -0.3 to -1 or 0.3 to 1, otherwise low speed scrolling will never scroll
        const desiredScrollTop = futureScrollPosition.scrollTop - (deltaScrollTop < 0 ? Math.floor(deltaScrollTop) : Math.ceil(deltaScrollTop));
        // this._verticalScrollbar.writeScrollPosition(desiredScrollPosition, desiredScrollTop);
        desiredScrollPosition.scrollTop = desiredScrollTop;
      }
      if (deltaX) {
        const deltaScrollLeft = SCROLL_WHEEL_SENSITIVITY * deltaX;
        // Here we convert values such as -0.3 to -1 or 0.3 to 1, otherwise low speed scrolling will never scroll
        const desiredScrollLeft = futureScrollPosition.scrollLeft - (deltaScrollLeft < 0 ? Math.floor(deltaScrollLeft) : Math.ceil(deltaScrollLeft));
        // this._horizontalScrollbar.writeScrollPosition(desiredScrollPosition, desiredScrollLeft);
        desiredScrollPosition.scrollLeft = desiredScrollLeft;
      }

      // Check that we are scrolling towards a location which is valid
      desiredScrollPosition = scrollable.validateScrollPosition(desiredScrollPosition);

      if (futureScrollPosition.scrollLeft !== desiredScrollPosition.scrollLeft || futureScrollPosition.scrollTop !== desiredScrollPosition.scrollTop) {
        const canPerformSmoothScroll = (
          SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED
            && mouseWheelSmoothScroll.value
            && classifier.isPhysicalMouseWheel()
        );

        if (canPerformSmoothScroll) {
          scrollable.setScrollPositionSmooth(desiredScrollPosition);
        } else {
          scrollable.setScrollPositionNow(desiredScrollPosition);
        }

        didScroll = true;
      }
    }

    let consumeMouseWheel = didScroll;
    if (!consumeMouseWheel && alwaysConsumeMouseWheel.value) {
      consumeMouseWheel = true;
    }
    if (!consumeMouseWheel && consumeMouseWheelIfScrollbarIsNeeded.value && (verticalScrollbar.value!.isNeeded() || horizontalScrollbar.value!.isNeeded())) {
      consumeMouseWheel = true;
    }

    if (consumeMouseWheel) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function _onDidScroll(e: ScrollEvent): void {
    if (horizontalScrollbar.value) {
      shouldRender.value = horizontalScrollbar.value.onDidScroll(e) || shouldRender.value;
    }

    if (verticalScrollbar.value) {
      shouldRender.value = verticalScrollbar.value.onDidScroll(e) || shouldRender.value;
    }

    if (useShadows) {
      shouldRender.value = true;
    }

    if (revealOnScroll) {
      _reveal();
    }

    if (!lazyRender.value) {
      _render();
    }

    emit('scroll', e);
  }

  function delegateScrollFromMouseWheelEvent(browserEvent: IMouseWheelEvent) {
    _onMouseWheel(new StandardWheelEvent(browserEvent));
  }

  function renderNow(): void {
    if (!lazyRender.value) {
      throw new Error('Please use `lazyRender` together with `renderNow`!');
    }

    _render();
  }

  function _render(): void {
    if (!shouldRender.value) return;

    shouldRender.value = false;

    horizontalScrollbar.value?.render();
    verticalScrollbar.value?.render();

    leftShadowClassName.value = '';
    topShadowClassName.value = '';
    topLeftShadowClassName.value = '';

    if (useShadows) {
      const scrollState = scrollable.getCurrentScrollPosition();
      const enableTop = scrollState.scrollTop > 0;
      const enableLeft = scrollState.scrollLeft > 0;

      const leftClassName = (enableLeft ? ' left' : '');
      const topClassName = (enableTop ? ' top' : '');
      const topLeftClassName = (enableLeft || enableTop ? ' top-left-corner' : '');

      leftShadowClassName.value = leftClassName;
      topShadowClassName.value = topClassName;
      topLeftShadowClassName.value = `${topLeftClassName}${topClassName}${leftClassName}`;
    }
  }

  // -------------------- fade in / fade out --------------------

  function _reveal(): void {
    horizontalScrollbar.value?.beginReveal();
    verticalScrollbar.value?.beginReveal();
    _scheduleHide();
  }

  function _hide(): void {
    if (!mouseIsOver.value && !isDragging.value) {
      horizontalScrollbar.value?.beginHide();
      verticalScrollbar.value?.beginHide();
    }
  }

  function _scheduleHide(): void {
    if (!mouseIsOver.value && !isDragging.value) {
      hideTimeout.start();
    }
  }

  function onScrollbarDragStart(): void {
    isDragging.value = true;
    _reveal();
  }

  function onScrollbarDragEnd(): void {
    isDragging.value = false;
    _hide();
  }

  function onDomNodeMouseOver(_e: IMouseEvent): void {
    mouseIsOver.value = true;
    _reveal();
  }

  function onDomNodeMouseLeave(_e: IMouseEvent): void {
    mouseIsOver.value = false;
    _hide();
  }

  function onDomNodeMouseWheel(browserEvent: IMouseWheelEvent): void {
    _onMouseWheel(new StandardWheelEvent(browserEvent));
  }

  function onScrollbarMouseWheel(e: StandardWheelEvent): void {
    _onMouseWheel(e);
  }

  function setScrollDimensions(dimension: INewScrollDimensions, useRawScrollPosition = false) {
    scrollable.setScrollDimensions(dimension, useRawScrollPosition);
  }

  return {
    leftShadowClassName,
    topShadowClassName,
    topLeftShadowClassName,

    horizontalScrollbarRef: horizontalScrollbar,
    verticalScrollbarRef: verticalScrollbar,

    delegateScrollFromMouseWheelEvent,
    renderNow,
    onDomNodeMouseWheel,
    onDomNodeMouseOver,
    onDomNodeMouseLeave,
    onScrollbarDragStart,
    onScrollbarDragEnd,
    onScrollbarMouseWheel,
    setScrollDimensions,
  };
}
