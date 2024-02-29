import type { SetupContext } from 'vue-demi';
import type { MaybeRefOrGetter } from '@vueuse/core';
import type { ScrollbarState } from './scrollbarState';
import type { INewScrollPosition, ScrollEvent, Scrollable, ScrollbarVisibility } from './scrollable';

import { computed, ref } from 'vue-demi';
import { toValue, toRef } from '@vueuse/core';
import { useScrollbarVisibilityController } from './scrollbarVisibilityController';
import { usePointerMove } from '../../hooks/usePointerMove';
import { isWindows } from '../../utils/platform';
import { getDomNodePagePosition } from '../../utils/dom';
import { StandardWheelEvent } from '../../utils/mouseEvent';

/**
 * The orthogonal distance to the slider at which dragging "resets". This implements "snapping"
 */
export const POINTER_DRAG_RESET_DISTANCE = 140;

export interface ISimplifiedPointerEvent {
  buttons: number;
  pageX: number;
  pageY: number;
}

export interface ScrollbarOptions {
  lazyRender?: boolean;
  visibility?: ScrollbarVisibility;

  hasArrows?: boolean;
  arrowSize?: number;
  scrollbarSize: number;
  oppositeScrollbarSize: number;
  sliderSize: number;

  scrollable: Scrollable;
  scrollByPage: boolean;
}

export interface ScrollbarEmits {
  (type: 'hostMousewheel', event: StandardWheelEvent): void;
  (type: 'hostDragstart'): void;
  (type: 'hostDragend'): void;
}

export interface ScrollbarInstance {
  $el: Element;
  /**
   * 显示滚动条
   */
  beginReveal(): void;
  /**
   * 隐藏滚动条
   */
  beginHide(): void;
  /**
   * 更新滚动条样式
   */
  render(): void;
  /**
   * 代理滚动条拖动
   */
  delegatePointerDown(e: PointerEvent): void;
  /**
   * 更新滚动条的大小（水平滚动条指的是高度，垂直滚动条指的是宽度）
   */
  updateScrollbarSize(scrollbarSize: number): void;
  /**
   * 是否需要渲染滚动条
   */
  isNeeded(): boolean;
  /**
   * 更新滚动条内部状态 scrollHeight, scrollTop, height
   */
  onDidScroll(e: ScrollEvent): boolean;
  writeScrollPosition(target: INewScrollPosition, scrollPosition: number): void;
}

export interface UseScrollbarOptions {
  scrollable: Scrollable;
  scrollbarState: ScrollbarState;

  lazyRender?: MaybeRefOrGetter<boolean>;
  visibility: MaybeRefOrGetter<ScrollbarVisibility>;
  extraScrollbarClassName: string;
  scrollByPage?: MaybeRefOrGetter<boolean>;

  // ----------------- Overwrite these

  _renderDomNode(largeSize: number, smallSize: number): void;
  _updateSlider(sliderSize: number, sliderPosition: number): void;
  _pointerDownRelativePosition(offsetX: number, offsetY: number): number;
  _sliderPointerPosition(e: ISimplifiedPointerEvent): number;
  _sliderOrthogonalPointerPosition(e: ISimplifiedPointerEvent): number;
  _updateScrollbarSize(size: number): void;
  writeScrollPosition(target: INewScrollPosition, scrollPosition: number): void;
}

export interface UseScrollbarEmits {
  hostMousewheel(event: StandardWheelEvent): void;
  hostDragstart(): void;
  hostDragend(): void;
}

export function useScrollbar(opts: UseScrollbarOptions, emit: SetupContext<UseScrollbarEmits>['emit']) {
  const domNodeRef = ref<HTMLElement>();
  const sliderActive = ref(false);
  const shouldRender = ref(true);

  const pointerMoveMonitor = usePointerMove();
  const visibilityController = useScrollbarVisibilityController(
    opts.visibility,
    `visible scrollbar ${opts.extraScrollbarClassName}`,
    `invisible scrollbar ${opts.extraScrollbarClassName}`,
  );

  const { scrollbarState, scrollable } = opts;
  const scrollByPage = computed(() => toValue(opts.scrollByPage));
  const lazyRender = computed(() => toValue(opts.lazyRender));

  function _onPointerDown(e: PointerEvent): void {
    if (!domNodeRef.value) return;

    let offsetX: number;
    let offsetY: number;
    if (e.target === domNodeRef.value && typeof e.offsetX === 'number' && typeof e.offsetY === 'number') {
      offsetX = e.offsetX;
      offsetY = e.offsetY;
    } else {
      const domNodePosition = getDomNodePagePosition(domNodeRef.value);
      offsetX = e.pageX - domNodePosition.left;
      offsetY = e.pageY - domNodePosition.top;
    }

    const offset = opts._pointerDownRelativePosition(offsetX, offsetY);
    _setDesiredScrollPositionNow(
      scrollByPage.value
        ? scrollbarState.getDesiredScrollPositionFromOffsetPaged(offset)
        : scrollbarState.getDesiredScrollPositionFromOffset(offset),
    );

    if (e.button === 0) {
      // left button
      e.preventDefault();
      _sliderPointerDown(e);
    }
  }

  function _sliderPointerDown(e: PointerEvent): void {
    if (!e.target || !(e.target instanceof Element)) {
      return;
    }

    const initialPointerPosition = opts._sliderPointerPosition(e);
    const initialPointerOrthogonalPosition = opts._sliderOrthogonalPointerPosition(e);
    const initialScrollbarState = scrollbarState.clone();
    sliderActive.value = true;

    pointerMoveMonitor.start(
      e.target,
      e.pointerId,
      e.buttons,
      (pointerMoveData: PointerEvent) => {
        const pointerOrthogonalPosition = opts._sliderOrthogonalPointerPosition(pointerMoveData);
        const pointerOrthogonalDelta = Math.abs(pointerOrthogonalPosition - initialPointerOrthogonalPosition);

        if (isWindows && pointerOrthogonalDelta > POINTER_DRAG_RESET_DISTANCE) {
          // The pointer has wondered away from the scrollbar => reset dragging
          _setDesiredScrollPositionNow(initialScrollbarState.getScrollPosition());
          return;
        }

        const pointerPosition = opts._sliderPointerPosition(pointerMoveData);
        const pointerDelta = pointerPosition - initialPointerPosition;
        _setDesiredScrollPositionNow(initialScrollbarState.getDesiredScrollPositionFromDelta(pointerDelta));
      },
      () => {
        sliderActive.value = false;
        emit('hostDragend');
      },
    );

    emit('hostDragstart');
  }

  function _setDesiredScrollPositionNow(_desiredScrollPosition: number): void {
    const desiredScrollPosition: INewScrollPosition = {};
    opts.writeScrollPosition(desiredScrollPosition, _desiredScrollPosition);
    scrollable.setScrollPositionNow(desiredScrollPosition);
  }

  function _onElementSize(visibleSize: number): boolean {
    if (scrollbarState.setVisibleSize(visibleSize)) {
      visibilityController.setIsNeeded(scrollbarState.isNeeded());
      shouldRender.value = true;
      if (!lazyRender.value) {
        render();
      }
    }
    return shouldRender.value;
  }

  function _onElementScrollSize(elementScrollSize: number): boolean {
    if (scrollbarState.setScrollSize(elementScrollSize)) {
      visibilityController.setIsNeeded(scrollbarState.isNeeded());
      shouldRender.value = true;
      if (!lazyRender.value) {
        render();
      }
    }
    return shouldRender.value;
  }

  function _onElementScrollPosition(elementScrollPosition: number): boolean {
    if (scrollbarState.setScrollPosition(elementScrollPosition)) {
      visibilityController.setIsNeeded(scrollbarState.isNeeded());
      shouldRender.value = true;
      if (!lazyRender.value) {
        render();
      }
    }
    return shouldRender.value;
  }

  function beginReveal(): void {
    visibilityController.setShouldBeVisible(true);
  }

  function beginHide(): void {
    visibilityController.setShouldBeVisible(false);
  }

  function render(): void {
    if (!shouldRender.value) return;
    shouldRender.value = false;

    opts._renderDomNode(scrollbarState.getRectangleLargeSize(), scrollbarState.getRectangleSmallSize());
    opts._updateSlider(scrollbarState.getSliderSize(), scrollbarState.getArrowSize() + scrollbarState.getSliderPosition());
  }

  function delegatePointerDown(e: PointerEvent): void {
    if (!domNodeRef.value) return;

    const domTop = domNodeRef.value.getClientRects()[0].top;
    const sliderStart = domTop + scrollbarState.getSliderPosition();
    const sliderStop = domTop + scrollbarState.getSliderPosition() + scrollbarState.getSliderSize();
    const pointerPos = opts._sliderPointerPosition(e);
    if (sliderStart <= pointerPos && pointerPos <= sliderStop) {
      // Act as if it was a pointer down on the slider
      if (e.button === 0) {
        e.preventDefault();
        _sliderPointerDown(e);
      }
    } else {
      // Act as if it was a pointer down on the scrollbar
      _onPointerDown(e);
    }
  }

  function onDomNodePointerDown(e: PointerEvent): void {
    if (e.target !== domNodeRef.value) {
      return;
    }
    _onPointerDown(e);
  }

  function onSliderPointerDown(e: PointerEvent): void {
    if (e.button === 0) {
      e.preventDefault();
      _sliderPointerDown(e);
    }
  }

  function onSliderClick(e: MouseEvent): void {
    if (e.button === 0) {
      e.stopPropagation();
    }
  }

  function onHostMousewheel(deltaX: number, deltaY: number): void {
    emit('hostMousewheel', new StandardWheelEvent(null, deltaX, deltaY));
  }

  function createOnDidScroll(
    scrollSizeProp: 'scrollWidth' | 'scrollHeight',
    scrollPositionProp: 'scrollLeft' | 'scrollTop',
    sizeProp: 'width' | 'height',
  ): (e: ScrollEvent) => boolean {
    return function onDidScroll(e: ScrollEvent): boolean {
      shouldRender.value = _onElementScrollSize(e[scrollSizeProp]) || shouldRender.value;
      shouldRender.value = _onElementScrollPosition(e[scrollPositionProp]) || shouldRender.value;
      shouldRender.value = _onElementSize(e[sizeProp]) || shouldRender.value;
      return shouldRender.value;
    };
  }

  function updateScrollbarSize(scrollbarSize: number): void {
    opts._updateScrollbarSize(scrollbarSize);
    scrollbarState.setScrollbarSize(scrollbarSize);
    shouldRender.value = true;
    if (!lazyRender.value) {
      render();
    }
  }

  return {
    shouldRender,
    domNodeRef,
    sliderActive,
    isVisible: toRef(visibilityController, 'isVisible'),
    className: toRef(visibilityController, 'className'),
    isNeeded: scrollbarState.isNeeded,
    beginReveal,
    beginHide,
    render,
    delegatePointerDown,
    onDomNodePointerDown,
    onSliderPointerDown,
    onSliderClick,
    onHostMousewheel,
    createOnDidScroll,
    updateScrollbarSize,
  };
}
