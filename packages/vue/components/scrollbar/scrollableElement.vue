<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue-demi';
import { type Fn, useEventListener, useTimeoutFn, tryOnScopeDispose } from '@vueuse/core';

import { type ScrollableElementOptions } from './scrollableElementOptions';
import HorizontalScrollbar from './horizontalScrollbar.vue';
import { ScrollbarVisibility, useScrollable } from './scrollable';
import type { ScrollEvent, INewScrollPosition } from './scrollable';
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
const onScroll = (e: ScrollEvent) => {
  //
};
const scrollable = useScrollable({
  onScroll,
  scheduleAtNextAnimationFrame,
  smoothScrollDuration: props.smoothScrollDuration,
  forceIntegerValues: props.forceIntegerValues,
});
const domNodeRef = ref<HTMLElement>();
const horizontalScrollbarRef = ref<InstanceType<typeof HorizontalScrollbar>>();
const verticalScrollbarRef = ref<InstanceType<typeof HorizontalScrollbar>>();

const computedHorizontalScrollbarSize = computed(() => props.horizontal === ScrollbarVisibility.Hidden ? 0 : props.horizontalScrollbarSize);
const computedHorizontalSliderSize = computed(() => typeof props.horizontalSliderSize !== 'undefined' ? props.horizontalSliderSize : props.horizontalScrollbarSize);

const computedVerticalScrollbarSize = computed(() => props.vertical === ScrollbarVisibility.Hidden ? 0 : props.verticalScrollbarSize);
const computedVerticalSliderSize = computed(() => typeof props.verticalSliderSize !== 'undefined' ? props.verticalSliderSize : props.verticalScrollbarSize);

const horizontalScrollbarState = reactive({
  visibleSize: 0,
  scrollSize: 0,
  scrollPosition: 0,
});

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
});

tryOnScopeDispose(() => {
  if (_mouseWheelToDispose) {
    _mouseWheelToDispose();
    _mouseWheelToDispose = null;
  }
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
          && props.mouseWheelSmoothScroll
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

function private_onDragStart() {
  isDragging.value = true;
  private_reveal();
}

function private_onDragEnd() {
  isDragging.value = false;
  private_hide();
}

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
  private_scheduleHide();
}

function private_hide() {
  if (!mouseIsOver.value && !isDragging.value) {
    horizontalScrollbarRef.value?.beginHide();
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

    <HorizontalScrollbar
      ref="horizontalScrollbarRef"
      :visibility="horizontal"
      :has-arrows="horizontalHasArrows"
      :arrow-size="arrowSize"
      :scrollbar-size="computedHorizontalScrollbarSize"
      :opposite-scrollbar-size="computedVerticalScrollbarSize"
      :slider-size="computedHorizontalSliderSize"
      :visible-size="horizontalScrollbarState.visibleSize"
      :scroll-size="horizontalScrollbarState.scrollSize"
      :scroll-position="horizontalScrollbarState.scrollPosition"
      :scroll-by-page="scrollByPage"
    />
  </div>
</template>
