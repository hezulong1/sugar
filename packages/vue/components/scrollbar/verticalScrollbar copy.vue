<script setup lang="ts">
import type { CSSProperties } from 'vue-demi';
import type { ISimplifiedPointerEvent, ScrollbarOptions, ScrollbarEmits } from './scrollbar';
import type { INewScrollPosition } from './scrollable';

import { computed, ref } from 'vue-demi';
import { toRef } from '@vueuse/core';
import { useScrollbar } from './scrollbar';
import { ScrollbarVisibility } from './scrollable';
import { ScrollbarState } from './scrollbarState';
import { ARROW_IMG_SIZE } from './scrollbarArrow';
import ScrollbarArrow from './scrollbarArrow.vue';

const props = withDefaults(defineProps<ScrollbarOptions>(), {
  visibility: ScrollbarVisibility.Auto,
  arrowSize: ARROW_IMG_SIZE,
});
const emit = defineEmits<ScrollbarEmits>();

const computedArrowSize = computed(() => props.hasArrows ? props.arrowSize : 0);
const computedScrollbarSize = computed(() => props.visibility === ScrollbarVisibility.Hidden ? 0 : props.scrollbarSize);

const scrollDimensions = computed(() => props.scrollable.getScrollDimensions());
const scrollPosition = computed(() => props.scrollable.getCurrentScrollPosition());

const scrollbarState = new ScrollbarState(
  computedArrowSize.value,
  computedScrollbarSize.value,
  0,
  scrollDimensions.value.height,
  scrollDimensions.value.scrollHeight,
  scrollPosition.value.scrollTop,
);

const scrollbarStyle = ref<CSSProperties>({
  position: 'absolute',
  // width: scrollbarState.value.getRectangleSmallSize() + 'px',
  // height: scrollbarState.value.getRectangleLargeSize() + 'px',
  width: '0px',
  height: '0px',
  top: '0px',
  right: '0px',
});
const sliderStyle = ref<CSSProperties>({
  position: 'absolute',
  // top: scrollbarState.value.getArrowSize() + scrollbarState.value.getScrollPosition() + 'px',
  top: 0,
  left: Math.floor((props.scrollbarSize - props.sliderSize) / 2) + 'px',
  width: props.sliderSize + 'px',
  // height: scrollbarState.value.getSliderSize() + 'px',
  height: undefined,
  transform: 'translate3d(0px, 0px, 0px)',
  contain: 'strict',
});

function _renderDomNode(largeSize: number, smallSize: number): void {
  scrollbarStyle.value.width = smallSize + 'px';
  scrollbarStyle.value.height = largeSize + 'px';
  scrollbarStyle.value.top = '0px';
  scrollbarStyle.value.right = '0px';
}

function _updateSlider(sliderSize: number, sliderPosition: number): void {
  sliderStyle.value.height = sliderSize + 'px';
  sliderStyle.value.top = sliderPosition + 'px';
}

function _pointerDownRelativePosition(_offsetX: number, offsetY: number): number {
  return offsetY;
}

function _sliderPointerPosition(e: ISimplifiedPointerEvent): number {
  return e.pageY;
}

function _sliderOrthogonalPointerPosition(e: ISimplifiedPointerEvent): number {
  return e.pageX;
}

function _updateScrollbarSize(size: number): void {
  sliderStyle.value.width = size + 'px';
}

function writeScrollPosition(target: INewScrollPosition, scrollPosition: number): void {
  target.scrollTop = scrollPosition;
}

const {
  domNodeRef,
  sliderActive,
  className,
  isNeeded,
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
} = useScrollbar({
  scrollbarState,
  scrollable: toRef(props, 'scrollable'),
  lazyRender: toRef(props, 'lazyRender'),
  visibility: toRef(props, 'visibility'),
  extraScrollbarClassName: 'vertical',
  scrollByPage: toRef(props, 'scrollByPage'),
  _renderDomNode,
  _updateSlider,
  _pointerDownRelativePosition,
  _sliderPointerPosition,
  _sliderOrthogonalPointerPosition,
  _updateScrollbarSize,
  writeScrollPosition,
}, emit);

const arrowDelta = computed(() => props.hasArrows ? ((computedArrowSize.value - ARROW_IMG_SIZE) / 2) : undefined);
const scrollbarDelta = computed(() => props.hasArrows ? ((computedScrollbarSize.value - ARROW_IMG_SIZE) / 2) : undefined);

defineExpose({
  beginReveal,
  beginHide,
  render,
  delegatePointerDown,
  updateScrollbarSize,
  isNeeded,
  onDidScroll: createOnDidScroll('scrollHeight', 'scrollTop', 'height'),
  writeScrollPosition,
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
        @activate="onHostMousewheel(0, 1)"
      >
        <slot name="startArrow">
          <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.0002 10.4403L13.5868 11L2.39352 11L2.00024 10.4607L7.62714 5L8.45403 5L14.0002 10.4403Z" fill="currentColor" />
          </svg>
        </slot>
      </ScrollbarArrow>

      <ScrollbarArrow
        class="scra"
        :left="scrollbarDelta"
        :bottom="arrowDelta"
        :bg-width="computedScrollbarSize"
        :bg-height="computedArrowSize"
        @activate="onHostMousewheel(0, -1)"
      >
        <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 5.55973L2.41344 5L13.6067 5L14 5.53925L8.37311 11H7.54622L2 5.55973Z" fill="currentColor" />
        </svg>
      </ScrollbarArrow>
    </template>

    <div class="slider" :class="{ active: sliderActive }" :style="sliderStyle" @click="onSliderClick" @pointerdown="onSliderPointerDown" />
  </div>
</template>
