<script setup lang="ts">
import type { ScrollableElementOptions, ScrollableElementEmits, ScrollableElementInstance } from './scrollableElement';

import { computed, markRaw, ref, useSlots, watchEffect } from 'vue-demi';
import { useEventListener, tryOnScopeDispose } from '@vueuse/core';

import { ScrollbarVisibility } from './scrollable';
import { useScrollableElement } from './scrollableElement';

import HorizontalScrollbar from './horizontalScrollbar.vue';
import VerticalScrollbar from './verticalScrollbar.vue';

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

  revealOnScroll: true,
});
const emit = defineEmits<ScrollableElementEmits>();
const slots = useSlots();
const onlyOneSlot = computed(() => {
  const defaultSlot = slots['default']?.();
  return defaultSlot ? (defaultSlot.length === 1) : false;
});
const {
  horizontalScrollbarRef,
  verticalScrollbarRef,
  onDomNodeMouseWheel,
  onDomNodeMouseOver,
  onDomNodeMouseLeave,
  onScrollbarDragStart,
  onScrollbarDragEnd,
  onScrollbarMouseWheel,
  setScrollDimensions,
} = useScrollableElement({
  scrollable: markRaw(props.scrollable),
  useShadows: props.useShadows,
  mouseWheelSmoothScroll: props.mouseWheelSmoothScroll,
  flipAxes: props.flipAxes,
  scrollYToX: props.scrollYToX,
  consumeMouseWheelIfScrollbarIsNeeded: props.consumeMouseWheelIfScrollbarIsNeeded,
  alwaysConsumeMouseWheel: props.alwaysConsumeMouseWheel,
  mouseWheelScrollSensitivity: props.mouseWheelScrollSensitivity,
  fastScrollSensitivity: props.fastScrollSensitivity,
  scrollPredominantAxis: props.scrollPredominantAxis,
  revealOnScroll: props.revealOnScroll,
}, emit);

const domNodeRef = ref<HTMLElement>();
const computedHorizontalScrollbarSize = computed(() => props.horizontal === ScrollbarVisibility.Hidden ? 0 : props.horizontalScrollbarSize);
const computedHorizontalSliderSize = computed(() => typeof props.horizontalSliderSize !== 'undefined' ? props.horizontalSliderSize : props.horizontalScrollbarSize);
const computedVerticalScrollbarSize = computed(() => props.vertical === ScrollbarVisibility.Hidden ? 0 : props.verticalScrollbarSize);
const computedVerticalSliderSize = computed(() => typeof props.verticalSliderSize !== 'undefined' ? props.verticalSliderSize : props.verticalScrollbarSize);
const listenOnDomNode = computed(() => typeof props.listenOnDomNode !== 'undefined' ? props.listenOnDomNode : domNodeRef.value);

useEventListener(listenOnDomNode, 'mouseover', onDomNodeMouseOver);
useEventListener(listenOnDomNode, 'mouseleave', onDomNodeMouseLeave);

let _mouseWheelToDispose: (() => void) | null = null;

const disposeMouseWheel = () => {
  if (_mouseWheelToDispose) {
    _mouseWheelToDispose();
    _mouseWheelToDispose = null;
  }
};

tryOnScopeDispose(() => {
  disposeMouseWheel();
});

watchEffect((onCleanup) => {
  onCleanup(disposeMouseWheel);

  if (props.handleMouseWheel && listenOnDomNode.value) {
    if (_mouseWheelToDispose) {
      _mouseWheelToDispose();
      _mouseWheelToDispose = null;
    }

    if (listenOnDomNode.value) {
      _mouseWheelToDispose = useEventListener(listenOnDomNode, 'wheel', onDomNodeMouseWheel, { passive: false });
    }
  }
});

defineExpose<Omit<ScrollableElementInstance, '$el'>>({
  setScrollDimensions,
});

function handleMounted() {
  debugger;
}
</script>

<template>
  <div ref="domNodeRef" class="monaco-scrollable-element" role="presentation" style="position: relative; overflow: hidden;">
    <slot @vue:mounted="handleMounted" />

    <HorizontalScrollbar
      ref="horizontalScrollbarRef"
      :visibility="horizontal"
      :has-arrows="horizontalHasArrows"
      :arrow-size="arrowSize"
      :scrollbar-size="computedHorizontalScrollbarSize"
      :opposite-scrollbar-size="computedVerticalScrollbarSize"
      :slider-size="computedHorizontalSliderSize"
      :scrollable="scrollable"
      :scroll-by-page="scrollByPage"
      @host-mousewheel="onScrollbarMouseWheel"
      @host-dragstart="onScrollbarDragStart"
      @host-dragend="onScrollbarDragEnd"
    />

    <VerticalScrollbar
      ref="verticalScrollbarRef"
      :visibility="vertical"
      :has-arrows="verticalHasArrows"
      :arrow-size="arrowSize"
      :scrollbar-size="computedVerticalScrollbarSize"
      :opposite-scrollbar-size="0"
      :slider-size="computedVerticalSliderSize"
      :scrollable="scrollable"
      :scroll-by-page="scrollByPage"
      @host-mousewheel="onScrollbarMouseWheel"
      @host-dragstart="onScrollbarDragStart"
      @host-dragend="onScrollbarDragEnd"
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
