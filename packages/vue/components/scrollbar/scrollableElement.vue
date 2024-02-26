<script setup lang="ts">
import { computed, ref, shallowRef, watch, watchEffect } from 'vue-demi';
import { type Fn, useEventListener, useTimeoutFn, tryOnScopeDispose, tryOnMounted } from '@vueuse/core';

import { type ScrollableElementOptions } from './scrollableElementOptions';

// import HorizontalScrollbar from './horizontalScrollbar.vue';
import VerticalScrollbar from './verticalScrollbar.vue';
import { Scrollable, ScrollbarVisibility } from './scrollable';
import type { ScrollEvent, INewScrollPosition, INewScrollDimensions } from './scrollable';
import { HIDE_TIMEOUT, MouseWheelClassifier, SCROLL_WHEEL_SENSITIVITY, SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED } from './scrollableElement';
import { type IMouseWheelEvent, StandardWheelEvent } from '../../utils/mouseEvent';
import { isMacintosh } from '../../utils/platform';
import { scheduleAtNextAnimationFrame } from '../../utils/scheduleAtNextAnimationFrame';

const props = withDefaults(defineProps<ScrollableElementOptions>(), {
  handleMouseWheel: true,
  mouseWheelSmoothScroll: true,
  mouseWheelScrollSensitivity: 1,
  fastScrollSensitivity: 5,
  scrollPredominantAxis: true,
  arrowSize: 11,
  horizontal: ScrollbarVisibility.Auto,
  horizontalScrollbarSize: 10,
  vertical: ScrollbarVisibility.Auto,
  verticalScrollbarSize: 10,

  forceIntegerValues: true,
  smoothScrollDuration: 0,
});
const emit = defineEmits<{
  (e: 'scroll', evt: ScrollEvent): void;
}>();
const domNodeRef = ref<HTMLElement>();
const horizontalScrollbarRef = ref<InstanceType<typeof VerticalScrollbar>>();
const verticalScrollbarRef = ref<InstanceType<typeof VerticalScrollbar>>();

const revealOnScroll = ref(true);

const onScroll = (e: ScrollEvent) => {
  verticalScrollbarRef.value?.onDidScroll(e);
  revealOnScroll.value && private_reveal();
  emit('scroll', e);
};
const scrollable = ref(new Scrollable({
  onScroll,
  scheduleAtNextAnimationFrame,
  smoothScrollDuration: props.smoothScrollDuration,
  forceIntegerValues: props.forceIntegerValues,
}));

const computedHorizontalScrollbarSize = computed(() => props.horizontal === ScrollbarVisibility.Hidden ? 0 : props.horizontalScrollbarSize);
// const computedHorizontalSliderSize = computed(() => typeof props.horizontalSliderSize !== 'undefined' ? props.horizontalSliderSize : props.horizontalScrollbarSize);

const computedVerticalScrollbarSize = computed(() => props.vertical === ScrollbarVisibility.Hidden ? 0 : props.verticalScrollbarSize);
const computedVerticalSliderSize = computed(() => typeof props.verticalSliderSize !== 'undefined' ? props.verticalSliderSize : props.verticalScrollbarSize);

const listenOnDomNode = computed(() => props.listenOnDomNode ? props.listenOnDomNode : domNodeRef.value);

useEventListener(listenOnDomNode, 'mouseover', private_onMouseOver);
useEventListener(listenOnDomNode, 'mouseleave', private_onMouseLeave);

let _mouseWheelToDispose: Fn | null = null;

watchEffect(() => {
  if (props.handleMouseWheel && listenOnDomNode.value) {
    if (_mouseWheelToDispose) {
      _mouseWheelToDispose();
      _mouseWheelToDispose = null;
    } else if (listenOnDomNode.value) {
      _mouseWheelToDispose = useEventListener(listenOnDomNode, 'wheel', private_onMouseWheel, { passive: false });
    }
  }

  console.log(scrollable.value._state);
});

// watch(() => props.smoothScrollDuration, (value) => {
//   scrollable.value.setSmoothScrollDuration(value);
// });

// watch(() => [props.forceIntegerValues, props.smoothScrollDuration], () => {
//   if (scrollable.value) {
//     scrollable.value.dispose();
//   }
//   scrollable.value = new Scrollable({
//     onScroll,
//     scheduleAtNextAnimationFrame,
//     forceIntegerValues: props.forceIntegerValues,
//     smoothScrollDuration: props.smoothScrollDuration,
//   });
// });

tryOnScopeDispose(() => {
  if (_mouseWheelToDispose) {
    _mouseWheelToDispose();
    _mouseWheelToDispose = null;
  }

  if (scrollable.value) {
    scrollable.value.dispose();
  }
});

function setScrollDimensions(dimension: INewScrollDimensions) {
  scrollable.value.setScrollDimensions(dimension, false);
}

defineExpose({
  setScrollDimensions,
});

function private_onMouseWheel(originEvent: IMouseWheelEvent) {
  const e = new StandardWheelEvent(originEvent);
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
    let deltaY = e.deltaY * props.mouseWheelScrollSensitivity;
    let deltaX = e.deltaX * props.mouseWheelScrollSensitivity;

    if (props.scrollPredominantAxis) {
      if (props.scrollYToX && deltaX + deltaY === 0) {
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

    if (props.flipAxes) {
      [deltaY, deltaX] = [deltaX, deltaY];
    }

    // Convert vertical scrolling to horizontal if shift is held, this
    // is handled at a higher level on Mac
    const shiftConvert = !isMacintosh && e.browserEvent && e.browserEvent.shiftKey;
    if ((props.scrollYToX || shiftConvert) && !deltaX) {
      deltaX = deltaY;
      deltaY = 0;
    }

    if (e.browserEvent && e.browserEvent.altKey) {
      // fastScrolling
      deltaX = deltaX * props.fastScrollSensitivity;
      deltaY = deltaY * props.fastScrollSensitivity;
    }

    const futureScrollPosition = scrollable.value.getFutureScrollPosition();

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
    desiredScrollPosition = scrollable.value.validateScrollPosition(desiredScrollPosition);

    if (futureScrollPosition.scrollLeft !== desiredScrollPosition.scrollLeft || futureScrollPosition.scrollTop !== desiredScrollPosition.scrollTop) {
      const canPerformSmoothScroll = (
        SCROLL_WHEEL_SMOOTH_SCROLL_ENABLED
          && props.mouseWheelSmoothScroll
          && classifier.isPhysicalMouseWheel()
      );

      if (canPerformSmoothScroll) {
        scrollable.value.setScrollPositionSmooth(desiredScrollPosition);
      } else {
        scrollable.value.setScrollPositionNow(desiredScrollPosition);
      }

      didScroll = true;
    }
  }

  let consumeMouseWheel = didScroll;
  if (!consumeMouseWheel && props.alwaysConsumeMouseWheel) {
    consumeMouseWheel = true;
  }
  if (!consumeMouseWheel && props.consumeMouseWheelIfScrollbarIsNeeded && (verticalScrollbarRef.value!.isNeeded() || horizontalScrollbarRef.value!.isNeeded())) {
    consumeMouseWheel = true;
  }

  if (consumeMouseWheel) {
    e.preventDefault();
    e.stopPropagation();
  }
}

// -------------------- fade in / fade out --------------------
const mouseIsOver = ref(false);
const isDragging = ref(false);
const hideTimer = useTimeoutFn(private_hide, HIDE_TIMEOUT, { immediate: false });

// function private_onDragStart() {
//   isDragging.value = true;
//   private_reveal();
// }

// function private_onDragEnd() {
//   isDragging.value = false;
//   private_hide();
// }

function private_onMouseOver() {
  mouseIsOver.value = true;
  private_reveal();
}

function private_onMouseLeave() {
  mouseIsOver.value = false;
  private_hide();
}

function private_reveal() {
  horizontalScrollbarRef.value?.beginReveal();
  verticalScrollbarRef.value?.beginReveal();
  private_scheduleHide();
}

function private_hide() {
  if (!mouseIsOver.value && !isDragging.value) {
    horizontalScrollbarRef.value?.beginHide();
    verticalScrollbarRef.value?.beginHide();
  }
}

function private_scheduleHide() {
  if (!mouseIsOver.value && !isDragging.value) {
    hideTimer.start();
  }
}
</script>

<template>
  <div ref="domNodeRef" class="monaco-scrollable-element" role="presentation" style="position: relative; overflow: hidden;">
    <slot />

    <VerticalScrollbar
      ref="verticalScrollbarRef"
      :visibility="vertical"
      :has-arrows="verticalHasArrows"
      :arrow-size="arrowSize"
      :scrollbar-size="computedVerticalScrollbarSize"
      :opposite-scrollbar-size="computedHorizontalScrollbarSize"
      :slider-size="computedVerticalSliderSize"
      :scrollable="scrollable"
      :scroll-by-page="scrollByPage"
    />
  </div>
</template>

<style>
/* Arrows */
.monaco-scrollable-element > .scrollbar > .scra {
  cursor: pointer;
  font-size: 11px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.monaco-scrollable-element > .visible {
  opacity: 1;

  /* Background rule added for IE9 - to allow clicks on dom node */
  background:rgba(0,0,0,0);

  transition: opacity 100ms linear;
  /* In front of peek view */
  z-index: 11;
}
.monaco-scrollable-element > .invisible {
  opacity: 0;
  pointer-events: none;
}
.monaco-scrollable-element > .invisible.fade {
  transition: opacity 800ms linear;
}

/* Scrollable Content Inset Shadow */
.monaco-scrollable-element > .shadow {
  position: absolute;
  display: none;
}
.monaco-scrollable-element > .shadow.top {
  display: block;
  top: 0;
  left: 3px;
  height: 3px;
  width: 100%;
  box-shadow: var(--vscode-scrollbar-shadow) 0 6px 6px -6px inset;
}
.monaco-scrollable-element > .shadow.left {
  display: block;
  top: 3px;
  left: 0;
  height: 100%;
  width: 3px;
  box-shadow: var(--vscode-scrollbar-shadow) 6px 0 6px -6px inset;
}
.monaco-scrollable-element > .shadow.top-left-corner {
  display: block;
  top: 0;
  left: 0;
  height: 3px;
  width: 3px;
}
.monaco-scrollable-element > .shadow.top.left {
  box-shadow: var(--vscode-scrollbar-shadow) 6px 0 6px -6px inset;
}

.monaco-scrollable-element > .scrollbar > .slider {
  background: var(--vscode-scrollbarSlider-background);
}

.monaco-scrollable-element > .scrollbar > .slider:hover {
  background: var(--vscode-scrollbarSlider-hoverBackground);
}

.monaco-scrollable-element > .scrollbar > .slider.active {
  background: var(--vscode-scrollbarSlider-activeBackground);
}

:root {
  --vscode-scrollbar-shadow: #000000;
  --vscode-scrollbarSlider-background: rgba(121, 121, 121, 0.4);
  --vscode-scrollbarSlider-hoverBackground: rgba(100, 100, 100, 0.7);
  --vscode-scrollbarSlider-activeBackground: rgba(191, 191, 191, 0.4);
}
</style>
