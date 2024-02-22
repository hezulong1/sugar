<script setup lang="ts">
import { type CSSProperties, computed, watchEffect, ref } from 'vue-demi';
import { type ScrollbarOptions, type ScrollbarEmits, POINTER_DRAG_RESET_DISTANCE } from './scrollbar';

import type { INewScrollPosition } from './scrollable';
import { ScrollbarVisibility } from './scrollable';
import ScrollbarArrow from './scrollbarArrow.vue';
import { ARROW_IMG_SIZE } from './scrollbarArrow';
import { useScrollbarVisiblityController } from './scrollbarVisibilityController';
import { useScrollbarState } from './scrollbarState';
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

const scrollbarState = useScrollbarState(
  computedArrowSize,
  computedScrollbarSize,
  props.oppositeScrollbarSize,
  props.visibleSize,
  props.scrollSize,
  props.scrollPosition,
);
const visiblityController = useScrollbarVisiblityController(props.visibility, 'visible scrollbar vertical', 'invisible scrollbar vertical');
const className = computed(() => visiblityController.className.value);

const scrollbarStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
    width: scrollbarState.rectangleSmallSize.value + 'px',
    height: scrollbarState.rectangleLargeSize.value + 'px',
    top: '0px',
    right: '0px',
  };
  return s;
});

watchEffect(() => {
  // 同步信息
  visiblityController.setIsNeeded(scrollbarState.isNeeded.value);
});

const arrowDelta = computed(() => props.hasArrows ? ((computedArrowSize.value - ARROW_IMG_SIZE) / 2) : undefined);
const scrollbarDelta = computed(() => props.hasArrows ? ((computedScrollbarSize.value - ARROW_IMG_SIZE) / 2) : undefined);

const sliderActive = ref(false);
const sliderStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
    top: scrollbarState.arrowSize.value + scrollbarState.scrollPosition.value + 'px',
    left: Math.floor((props.scrollbarSize - props.sliderSize) / 2) + 'px',
    width: props.sliderSize + 'px',
    height: scrollbarState.sliderSize.value + 'px',
    transform: 'translate3d(0px, 0px, 0px)',
    contain: 'strict',
  };

  return s;
});

function _sliderPointerDown(e: PointerEvent) {
  if (!e.target || !(e.target instanceof Element)) {
    return;
  }

  const initialPointerPosition = e.pageY;
  const initialPointerOrthogonalPosition = e.pageX;
  const initialScrollbarState = useScrollbarState();
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
        _setDesiredScrollPositionNow(initialScrollbarState.getScrollPosition().value);
        return;
      }

      const pointerPosition = e.pageY;
      const pointerDelta = pointerPosition - initialPointerPosition;
      _setDesiredScrollPositionNow(initialScrollbarState.getDesiredScrollPositionFromDelta(pointerDelta).value);
    },
    () => {
      sliderActive.value = false;
      emit('hostDragend');
    },
  );

  emit('hostDragstart');
}

function _setDesiredScrollPositionNow(_desiredScrollPosition: number) {
  const desiredScrollPosition: INewScrollPosition = {};
  desiredScrollPosition.scrollTop = _desiredScrollPosition;
  emit('setScrollPositionNow', desiredScrollPosition);
}

function onPointerDown(e: PointerEvent) {
  if (e.target !== domNodeRef.value) {
    return;
  }
  _onPointerDown(e);
}

function _onPointerDown(e: PointerEvent) {
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

  const offset = offsetY;// this._pointerDownRelativePosition(offsetX, offsetY);
  _setDesiredScrollPositionNow(
    props.scrollByPage
      ? scrollbarState.getDesiredScrollPositionFromOffsetPaged(offset).value
      : scrollbarState.getDesiredScrollPositionFromOffset(offset).value,
  );

  if (e.button === 0) {
    // left button
    e.preventDefault();
    _sliderPointerDown(e);
  }
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

function onStandardMouseWheel(deltaX: number, deltaY: number) {
  emit('hostMousewheel', deltaX, deltaY);
}

// ----------------- rendering

function beginReveal() {
  visiblityController.setShouldBeVisible(true);
}

function beginHide() {
  visiblityController.setShouldBeVisible(false);
}

defineExpose({
  beginReveal,
  beginHide,
  isNeeded: () => scrollbarState.isNeeded.value,
});
</script>

<template>
  <div ref="domNodeRef" role="presentation" aria-hidden="true" :class="className" :style="scrollbarStyle" @pointerdown="onPointerDown">
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
