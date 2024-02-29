<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { ScrollEvent, ScrollableElementInstance } from '@local/vue';

import { ScrollableElement, Scrollable, scheduleAtNextAnimationFrame } from '@local/vue';
import { markRaw, nextTick, onMounted, onScopeDispose, reactive, ref } from 'vue';

const domNodeRef = ref<ScrollableElementInstance>();
const contentRef = ref<HTMLElement>();
const contentStyle = reactive<CSSProperties>({
  width: undefined,
  height: undefined,
  top: '0px',
  left: '0px',
});

const scrollable = markRaw(new Scrollable({
  forceIntegerValues: true,
  smoothScrollDuration: 125,
  scheduleAtNextAnimationFrame: callback => scheduleAtNextAnimationFrame(callback),
}));

const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    contentStyle.width = undefined;
    contentStyle.height = undefined;
    nextTick(() => {
      if (!contentRef.value || !domNodeRef.value) return;

      const { scrollWidth, scrollHeight } = contentRef.value;
      domNodeRef.value.setScrollDimensions({ width, height, scrollWidth, scrollHeight });
      contentStyle.width = scrollWidth + 'px';
      contentStyle.height = scrollHeight + 'px';
    });
  }
});

onMounted(() => {
  domNodeRef.value && ro.observe(domNodeRef.value.$el);
});

onScopeDispose(() => {
  ro.disconnect();
});

function onScroll(e: ScrollEvent) {
  contentStyle.top = e.scrollTop * -1 + 'px';
  contentStyle.left = e.scrollLeft * -1 + 'px';
}
</script>

<template>
  <ScrollableElement ref="domNodeRef" :scrollable="scrollable" @scroll="onScroll">
    <div ref="contentRef" class="monaco-list-rows" :style="contentStyle">
      <div v-for="i of 100" :key="i" :style="`width: 350px; margin-block: 2px; border: ${ i % 2 ? '1px solid blue' : '1px solid red' }`">{{ i }}</div>
    </div>
  </ScrollableElement>
</template>
