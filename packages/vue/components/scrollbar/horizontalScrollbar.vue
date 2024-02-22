<script setup lang="ts">
import { type CSSProperties, computed, watchEffect, ref } from 'vue-demi';
import { type ScrollbarOptions, type ScrollbarEmits, POINTER_DRAG_RESET_DISTANCE } from './scrollbar';

import { ScrollbarVisibility } from './scrollable';
import ScrollbarArrow from './scrollbarArrow.vue';
import { ARROW_IMG_SIZE } from './scrollbarArrow';
import { useScrollbarVisiblityController } from './scrollbarVisibilityController';
import { useScrollbarState } from './scrollbarState';
import { usePointerMove } from '../../hooks/usePointerMove';
import { isWindows } from '../../utils/platform';

const props = withDefaults(defineProps<ScrollbarOptions>(), {
  visibility: ScrollbarVisibility.Auto,
  arrowSize: ARROW_IMG_SIZE,
});
const emit = defineEmits<ScrollbarEmits>();
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
const visiblityController = useScrollbarVisiblityController(props.visibility, 'visible scrollbar horizontal', 'invisible scrollbar horizontal');
const className = computed(() => visiblityController.className.value);

const scrollbarStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
    width: scrollbarState.rectangleLargeSize.value + 'px',
    height: scrollbarState.rectangleSmallSize.value + 'px',
    left: '0px',
    bottom: '0px',
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
    top: Math.floor((props.scrollbarSize - props.sliderSize) / 2) + 'px',
    left: scrollbarState.arrowSize.value + scrollbarState.scrollPosition.value + 'px',
    width: scrollbarState.sliderSize.value + 'px',
    height: props.sliderSize + 'px',
    transform: 'translate3d(0px, 0px, 0px)',
    contain: 'strict',
  };

  return s;
});

function _sliderPointerDown(e: PointerEvent) {
  if (!e.target || !(e.target instanceof Element)) {
    return;
  }

  const initialPointerPosition = e.pageX;
  const initialPointerOrthogonalPosition = e.pageY;
  // const initialScrollbarState = this._scrollbarState.clone();
  sliderActive.value = true;

  pointerMoveMonitor.start(
    e.target,
    e.pointerId,
    e.buttons,
    (pointerMoveData: PointerEvent) => {
      const pointerOrthogonalPosition = e.pageY;
      const pointerOrthogonalDelta = Math.abs(pointerOrthogonalPosition - initialPointerOrthogonalPosition);

      if (isWindows && pointerOrthogonalDelta > POINTER_DRAG_RESET_DISTANCE) {
        // The pointer has wondered away from the scrollbar => reset dragging
        // this._setDesiredScrollPositionNow(initialScrollbarState.getScrollPosition());
        return;
      }

      const pointerPosition = e.pageX;
      const pointerDelta = pointerPosition - initialPointerPosition;
      // this._setDesiredScrollPositionNow(initialScrollbarState.getDesiredScrollPositionFromDelta(pointerDelta));
    },
    () => {
      sliderActive.value = false;
      emit('hostDragend');
    },
  );

  emit('hostDragstart');
}

function onPointerDown(e: PointerEvent) {
  //
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
  <div role="presentation" aria-hidden="true" :class="className" :style="scrollbarStyle" @pointerdown="onPointerDown">
    <template v-if="hasArrows">
      <ScrollbarArrow
        class="scra"
        :top="scrollbarDelta"
        :left="arrowDelta"
        :bg-width="computedArrowSize"
        :bg-height="computedScrollbarSize"
        @activate="onStandardMouseWheel(1, 0)"
      >
        <slot name="startArrow">
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.4405 2L11.0002 2.41344L11.0002 13.6067L10.461 14L5.00024 8.37311L5.00024 7.54622L10.4405 2Z" fill="currentColor" />
          </svg>
        </slot>
      </ScrollbarArrow>

      <ScrollbarArrow
        class="scra"
        :top="scrollbarDelta"
        :right="arrowDelta"
        :bg-width="computedArrowSize"
        :bg-height="computedScrollbarSize"
        @activate="onStandardMouseWheel(-1, 0)"
      >
        <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.55997 14L5.00024 13.5866L5.00024 2.39328L5.53949 2L11.0002 7.62689L11.0002 8.45378L5.55997 14Z" fill="currentColor" />
        </svg>
      </ScrollbarArrow>
    </template>

    <div class="slider" :class="{ active: sliderActive }" :style="sliderStyle" @click="onSliderClick" @pointerdown="onSliderPointerDown" />
  </div>
</template>
