<script setup lang="ts">
import { type CSSProperties, computed, ref, watch } from 'vue-demi';
import { type ScrollbarOptions, type ScrollbarEmits, POINTER_DRAG_RESET_DISTANCE } from './scrollbar';

import type { INewScrollPosition, ScrollEvent } from './scrollable';
import { ScrollbarVisibility } from './scrollable';
import ScrollbarArrow from './scrollbarArrow.vue';
import { ARROW_IMG_SIZE } from './scrollbarArrow';
import { useScrollbarVisibilityController } from './scrollbarVisibilityController';
import { ScrollbarState } from './scrollbarState';
import { usePointerMove } from '../../hooks/usePointerMove';
import { isWindows } from '../../utils/platform';
import { getDomNodePagePosition } from '../../utils/dom';

const props = withDefaults(defineProps<ScrollbarOptions>(), {
  visibility: ScrollbarVisibility.Auto,
  arrowSize: ARROW_IMG_SIZE,
});
const emit = defineEmits<ScrollbarEmits>();

const domNodeRef = ref<HTMLElement>();
const pointerMoveMonitor = usePointerMove();

const computedArrowSize = computed(() => props.hasArrows ? props.arrowSize : 0);
const computedScrollbarSize = computed(() => props.visibility === ScrollbarVisibility.Hidden ? 0 : props.scrollbarSize);

const scrollDimensions = computed(() => props.scrollable.getScrollDimensions());
const scrollPosition = computed(() => props.scrollable.getCurrentScrollPosition());
const scrollbarState = computed(() => new ScrollbarState(
  computedArrowSize.value,
  computedScrollbarSize.value,
  0,
  scrollDimensions.value.height,
  scrollDimensions.value.scrollHeight,
  scrollPosition.value.scrollTop,
));

const visibilityController = useScrollbarVisibilityController(props.visibility, 'visible scrollbar vertical', 'invisible scrollbar vertical');
const className = computed(() => visibilityController.className.value);
const scrollbarStyle = ref<CSSProperties>({
  position: 'absolute',
  width: scrollbarState.value.getRectangleSmallSize() + 'px',
  height: scrollbarState.value.getRectangleLargeSize() + 'px',
  top: '0px',
  right: '0px',
});
const sliderActive = ref(false);
const sliderStyle = ref<CSSProperties>({
  position: 'absolute',
  top: scrollbarState.value.getArrowSize() + scrollbarState.value.getScrollPosition() + 'px',
  left: Math.floor((props.scrollbarSize - props.sliderSize) / 2) + 'px',
  width: props.sliderSize + 'px',
  height: scrollbarState.value.getSliderSize() + 'px',
  transform: 'translate3d(0px, 0px, 0px)',
  contain: 'strict',
});

watch(scrollbarState, () => {
  scrollbarStyle.value.width = scrollbarState.value.getRectangleSmallSize() + 'px';
  scrollbarStyle.value.height = scrollbarState.value.getRectangleLargeSize() + 'px';
  scrollbarStyle.value.top = '0px';
  scrollbarStyle.value.right = '0px';
  sliderStyle.value.top = scrollbarState.value.getArrowSize() + scrollbarState.value.getSliderPosition() + 'px';
  sliderStyle.value.height = scrollbarState.value.getSliderSize() + 'px';
  visibilityController.setIsNeeded(scrollbarState.value.isNeeded());
});

const arrowDelta = computed(() => props.hasArrows ? ((computedArrowSize.value - ARROW_IMG_SIZE) / 2) : undefined);
const scrollbarDelta = computed(() => props.hasArrows ? ((computedScrollbarSize.value - ARROW_IMG_SIZE) / 2) : undefined);

function _setDesiredScrollPositionNow(_desiredScrollPosition: number) {
  const desiredScrollPosition: INewScrollPosition = {};
  // FN
  desiredScrollPosition.scrollTop = _desiredScrollPosition;
  // emit('setScrollPositionNow', desiredScrollPosition);
  props.scrollable.setScrollPositionNow(desiredScrollPosition);
}

function _onPointerDown(e: PointerEvent) {
  if (!domNodeRef.value) return;

  // let offsetX: number;
  let offsetY: number;
  if (e.target === domNodeRef.value && typeof e.offsetX === 'number' && typeof e.offsetY === 'number') {
    // offsetX = e.offsetX;
    offsetY = e.offsetY;
  } else {
    const domNodePosition = getDomNodePagePosition(domNodeRef.value);
    // offsetX = e.pageX - domNodePosition.left;
    offsetY = e.pageY - domNodePosition.top;
  }

  const offset = offsetY;// this._pointerDownRelativePosition(offsetX, offsetY);
  _setDesiredScrollPositionNow(
    props.scrollByPage
      ? scrollbarState.value.getDesiredScrollPositionFromOffsetPaged(offset)
      : scrollbarState.value.getDesiredScrollPositionFromOffset(offset),
  );

  if (e.button === 0) {
    // left button
    e.preventDefault();
    _sliderPointerDown(e);
  }
}

function onDomNodePointerDown(e: PointerEvent) {
  if (e.target !== domNodeRef.value) {
    return;
  }
  _onPointerDown(e);
}

function _sliderPointerDown(e: PointerEvent) {
  if (!e.target || !(e.target instanceof Element)) {
    return;
  }

  const initialPointerPosition = e.pageY;
  const initialPointerOrthogonalPosition = e.pageX;
  const initialScrollbarState = scrollbarState.value.clone();
  sliderActive.value = true;

  pointerMoveMonitor.start(
    e.target,
    e.pointerId,
    e.buttons,
    (pointerMoveData: PointerEvent) => {
      const pointerOrthogonalPosition = e.pageX;
      const pointerOrthogonalDelta = Math.abs(pointerOrthogonalPosition - initialPointerOrthogonalPosition);

      if (isWindows && pointerOrthogonalDelta > POINTER_DRAG_RESET_DISTANCE) {
        // The pointer has wondered away from the scrollbar => reset dragging
        _setDesiredScrollPositionNow(initialScrollbarState.getScrollPosition());
        return;
      }

      const pointerPosition = e.pageY;
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

function onSliderPointerDown(e: PointerEvent) {
  if (e.button === 0) {
    e.preventDefault();
    _sliderPointerDown(e);
  }
}

function onSliderClick(e: MouseEvent) {
  if (e.button === 0) {
    e.stopPropagation();
  }
}

function _onElementSize(visibleSize: number) {
  if (scrollbarState.value.setVisibleSize(visibleSize)) {
    visibilityController.setIsNeeded(scrollbarState.value.isNeeded());
  }
}

function _onElementScrollSize(elementScrollSize: number) {
  if (scrollbarState.value.setScrollSize(elementScrollSize)) {
    visibilityController.setIsNeeded(scrollbarState.value.isNeeded());
  }
}

function _onElementScrollPosition(elementScrollPosition: number) {
  if (scrollbarState.value.setScrollPosition(elementScrollPosition)) {
    visibilityController.setIsNeeded(scrollbarState.value.isNeeded());
  }
}

function onStandardMouseWheel(deltaX: number, deltaY: number) {
  emit('hostMousewheel', deltaX, deltaY);
}

// ----------------- rendering

function beginReveal() {
  visibilityController.setShouldBeVisible(true);
}

function beginHide() {
  visibilityController.setShouldBeVisible(false);
}

defineExpose({
  beginReveal,
  beginHide,
  isNeeded: () => scrollbarState.value.isNeeded(),
  updateScrollbarSize: (scrollbarSize: number) => {
    sliderStyle.value.width = scrollbarSize;
    scrollbarState.value.setScrollbarSize(scrollbarSize);
  },
  onDidScroll: (e: ScrollEvent) => {
    _onElementScrollSize(e.scrollHeight);
    _onElementScrollPosition(e.scrollTop);
    _onElementSize(e.height);
  },
});
</script>

<template>
  <div ref="domNodeRef" role="presentation" aria-hidden="true" :class="className" :style="scrollbarStyle" @pointerdown="onDomNodePointerDown">
    <template v-if="hasArrows">
      <ScrollbarArrow
        class="scra"
        :top="arrowDelta"
        :left="scrollbarDelta"
        :bg-width="computedScrollbarSize"
        :bg-height="computedArrowSize"
        @activate="onStandardMouseWheel(0, 1)"
      >
        <slot name="startArrow">
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.0002 10.4403L13.5868 11L2.39352 11L2.00024 10.4607L7.62714 5L8.45403 5L14.0002 10.4403Z" fill="#currentColor" />
          </svg>
        </slot>
      </ScrollbarArrow>

      <ScrollbarArrow
        class="scra"
        :left="scrollbarDelta"
        :bottom="arrowDelta"
        :bg-width="computedScrollbarSize"
        :bg-height="computedArrowSize"
        @activate="onStandardMouseWheel(0, -1)"
      >
        <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 5.55973L2.41344 5L13.6067 5L14 5.53925L8.37311 11H7.54622L2 5.55973Z" fill="currentColor" />
        </svg>
      </ScrollbarArrow>
    </template>

    <div class="slider" :class="{ active: sliderActive }" :style="sliderStyle" @click="onSliderClick" @pointerdown="onSliderPointerDown" />
  </div>
</template>
