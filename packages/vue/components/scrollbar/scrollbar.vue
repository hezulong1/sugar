<script setup lang="ts">
import { type CSSProperties, computed } from 'vue-demi';
import type { ScrollbarOptions } from './scrollbar';
import { useAbstractScrollbar } from './scrollbar';
import { ScrollbarVisibility } from './scrollable';
import ScrollbarArrow from './scrollbarArrow.vue';
import { ARROW_IMG_SIZE } from './scrollbarArrow';

const props = withDefaults(defineProps<ScrollbarOptions>(), {
  arrowSize: 11,
});

const visibility = computed(() => props.visibility);
const arrowSize = computed(() => props.hasArrows ? props.arrowSize : 0);
const scrollbarSize = computed(() => visibility.value === ScrollbarVisibility.Hidden ? 0 : props.scrollbarSize);
const oppositeScrollbarSize = computed(() => visibility.value === ScrollbarVisibility.Hidden ? 0 : props.oppositeScrollbarSize);
const visibleSize = computed(() => props.visibleSize);
const scrollSize = computed(() => props.scrollSize);
const scrollPosition = computed(() => props.scrollPosition);

const arrowDelta = computed(() => props.hasArrows ? ((arrowSize.value - ARROW_IMG_SIZE) / 2) : undefined);
const scrollbarDelta = computed(() => props.hasArrows ? ((scrollbarSize.value - ARROW_IMG_SIZE) / 2) : undefined);

const { controller, state } = useAbstractScrollbar({
  visibility,
  arrowSize,
  scrollbarSize,
  oppositeScrollbarSize,
  visibleSize,
  scrollSize,
  scrollPosition,
});

controller.setIsNeeded(state.isNeeded.value);

const klass = [props.vertical ? 'vertical' : 'horizontal', controller.className.value];

const scrollbarStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
  };
  return s;
});

const sliderStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
    top: props.vertical ? '0px' : (Math.floor((props.scrollbarSize - props.sliderSize) / 2) + 'px'),
    left: props.vertical ? (Math.floor((props.scrollbarSize - props.sliderSize) / 2) + 'px') : '0px',
    width: props.vertical ? (props.sliderSize + 'px') : undefined,
    height: props.vertical ? undefined : (props.sliderSize + 'px'),
    transform: 'translate3d(0px, 0px, 0px)',
    contain: 'strict',
  };

  return s;
});

function onPointerDown(e: PointerEvent) {
  //
}

function handleActivate(deltaX: number, deltaY: number) {
  //
}
</script>

<template>
  <div :class="klass" role="presentation" aria-hidden="true" :style="scrollbarStyle" @pointerdown="onPointerDown">
    <template v-if="hasArrows">
      <ScrollbarArrow
        class-name="scra"
        :top="vertical ? arrowDelta : scrollbarDelta"
        :right="undefined"
        :bottom="undefined"
        :left="vertical ? scrollbarDelta : arrowDelta"
        :bg-width="vertical ? scrollbarSize : arrowSize"
        :bg-height="vertical ? arrowSize : scrollbarSize"
        @activate="vertical ? handleActivate(0, 1) : handleActivate(1, 0)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            :d="vertical
              ? 'M14.0002 10.4403L13.5868 11L2.39352 11L2.00024 10.4607L7.62714 5L8.45403 5L14.0002 10.4403Z'
              : 'M10.4405 2L11.0002 2.41344L11.0002 13.6067L10.461 14L5.00024 8.37311L5.00024 7.54622L10.4405 2Z'
            "
            fill="currentColor"
          />
        </svg>
      </ScrollbarArrow>

      <ScrollbarArrow
        class-name="scra"
        :top="vertical ? undefined : scrollbarDelta"
        :right="vertical ? undefined : arrowDelta"
        :bottom="vertical ? arrowDelta : undefined"
        :left="vertical ? scrollbarDelta : undefined"
        :bg-width="vertical ? scrollbarSize : arrowSize"
        :bg-height="vertical ? arrowSize : scrollbarSize"
        @activate="vertical ? handleActivate(0, -1) : handleActivate(-1, 0)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            :d="vertical
              ? 'M2 5.55973L2.41344 5L13.6067 5L14 5.53925L8.37311 11H7.54622L2 5.55973Z'
              : 'M5.55997 14L5.00024 13.5866L5.00024 2.39328L5.53949 2L11.0002 7.62689L11.0002 8.45378L5.55997 14Z'
            "
            fill="currentColor"
          />
        </svg>
      </ScrollbarArrow>
    </template>

    <div class="slider" :style="sliderStyle" />
  </div>
</template>
