<script setup lang="ts">
import type { CSSProperties } from 'vue-demi';
import type { INewScrollPosition } from './scrollable';
import type { ISimplifiedPointerEvent, ScrollbarOptions, ScrollbarEmits, ScrollbarInstance } from './scrollbar';

import { computed, markRaw, ref } from 'vue-demi';
import { toRef } from '@vueuse/core';
import { ScrollbarVisibility } from './scrollable';
import { useScrollbar } from './scrollbar';
import { ScrollbarState } from './scrollbarState';
import { ARROW_IMG_SIZE } from './scrollbarArrow';
import ScrollbarArrow from './scrollbarArrow.vue';

const props = withDefaults(defineProps<ScrollbarOptions>(), {
  visibility: ScrollbarVisibility.Auto,
  arrowSize: ARROW_IMG_SIZE,
});
const emit = defineEmits<ScrollbarEmits>();

const computedScrollbarSize = computed(() => props.visibility === ScrollbarVisibility.Hidden ? 0 : props.scrollbarSize);

let computedArrowSize = 0;
let arrowDelta: number | undefined, scrollbarDelta: number | undefined;

if (props.hasArrows) {
  computedArrowSize = props.arrowSize;
  arrowDelta = (computedArrowSize - ARROW_IMG_SIZE) / 2;
  scrollbarDelta = (computedScrollbarSize.value - ARROW_IMG_SIZE) / 2;
}
const scrollable = markRaw(props.scrollable);
const scrollDimensions = scrollable.getScrollDimensions();
const scrollPosition = scrollable.getCurrentScrollPosition();
const scrollbarState = markRaw(new ScrollbarState(
  computedArrowSize,
  computedScrollbarSize.value,
  props.oppositeScrollbarSize,
  scrollDimensions.width,
  scrollDimensions.scrollWidth,
  scrollPosition.scrollLeft,
));

const scrollbarStyle = ref<CSSProperties>({
  position: 'absolute',
  width: '0px',
  height: '0px',
  left: '0px',
  bottom: '0px',
});
const sliderStyle = ref<CSSProperties>({
  position: 'absolute',
  top: Math.floor((props.scrollbarSize - props.sliderSize) / 2) + 'px',
  left: '0px',
  width: undefined,
  height: props.sliderSize + 'px',
  transform: 'translate3d(0px, 0px, 0px)',
  contain: 'strict',
});

function _renderDomNode(largeSize: number, smallSize: number): void {
  scrollbarStyle.value.width = largeSize + 'px';
  scrollbarStyle.value.height = smallSize + 'px';
}

function _updateSlider(sliderSize: number, sliderPosition: number): void {
  sliderStyle.value.width = sliderSize + 'px';
  sliderStyle.value.left = sliderPosition + 'px';
}

function _pointerDownRelativePosition(offsetX: number, _offsetY: number): number {
  return offsetX;
}

function _sliderPointerPosition(e: ISimplifiedPointerEvent): number {
  return e.pageX;
}

function _sliderOrthogonalPointerPosition(e: ISimplifiedPointerEvent): number {
  return e.pageY;
}

function _updateScrollbarSize(size: number): void {
  sliderStyle.value.height = size + 'px';
}

function writeScrollPosition(target: INewScrollPosition, scrollPosition: number): void {
  target.scrollLeft = scrollPosition;
}

const {
  shouldRender,
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
  scrollable,
  scrollbarState,

  lazyRender: toRef(props, 'lazyRender'),
  visibility: toRef(props, 'visibility'),
  extraScrollbarClassName: 'horizontal',
  scrollByPage: toRef(props, 'scrollByPage'),

  _renderDomNode,
  _updateSlider,
  _pointerDownRelativePosition,
  _sliderPointerPosition,
  _sliderOrthogonalPointerPosition,
  _updateScrollbarSize,
  writeScrollPosition,
}, emit);

defineExpose<ScrollbarInstance>({
  beginReveal,
  beginHide,
  render,
  delegatePointerDown,
  updateScrollbarSize,
  isNeeded,
  onDidScroll: createOnDidScroll('scrollWidth', 'scrollLeft', 'width'),
  writeScrollPosition,
});
</script>

<template>
  <div
    v-if="!shouldRender"
    ref="domNodeRef"
    role="presentation"
    aria-hidden="true"
    :class="className"
    :style="scrollbarStyle"
    @pointerdown="onDomNodePointerDown"
  >
    <template v-if="hasArrows">
      <ScrollbarArrow
        class="scra"
        :top="scrollbarDelta"
        :left="arrowDelta"
        :bg-width="computedArrowSize"
        :bg-height="computedScrollbarSize"
        @activate="onHostMousewheel(1, 0)"
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
        @activate="onHostMousewheel(-1, 0)"
      >
        <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.55997 14L5.00024 13.5866L5.00024 2.39328L5.53949 2L11.0002 7.62689L11.0002 8.45378L5.55997 14Z" fill="currentColor" />
        </svg>
      </ScrollbarArrow>
    </template>

    <div class="slider" :class="{ active: sliderActive }" :style="sliderStyle" @click="onSliderClick" @pointerdown="onSliderPointerDown" />
  </div>
</template>
