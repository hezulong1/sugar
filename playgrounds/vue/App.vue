<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { ScrollEvent, ScrollableElementInstance } from '@local/vue';

import { ScrollableElement, Scrollable, scheduleAtNextAnimationFrame } from '@local/vue';
import { markRaw, onMounted, reactive, ref } from 'vue';

const domNodeRef = ref<ScrollableElementInstance>();
const contentStyle = reactive<CSSProperties>({
  top: '0px',
  left: '0px',
});

const scrollable = markRaw(new Scrollable({
  forceIntegerValues: true,
  smoothScrollDuration: 125,
  scheduleAtNextAnimationFrame: callback => scheduleAtNextAnimationFrame(callback),
}));

onMounted(() => {
  domNodeRef.value?.setScrollDimensions({
    width: 300,
    scrollWidth: 400,
    height: 280,
    scrollHeight: 500,
  });
});

function onScroll(e: ScrollEvent) {
  contentStyle.top = e.scrollTop * -1 + 'px';
  contentStyle.left = e.scrollLeft * -1 + 'px';
}
</script>

<template>
  <ScrollableElement ref="domNodeRef" :scrollable="scrollable" @scroll="onScroll">
    <!--
      <div ref="contentRef" class="monaco-list-rows" :style="contentStyle">
      <div v-for="i of 100" :key="i" :style="`width: 350px; margin-block: 2px; border: ${ i % 2 ? '1px solid blue' : '1px solid red' }`">{{ i }}</div>
      </div>
    -->
    <div :style="contentStyle" style="position: relative; width: 400px; height: 200px; background-color: red;" />
    <div :style="contentStyle" style="position: relative; width: 400px; height: 300px; background-color: yellowgreen;" />
  </ScrollableElement>
</template>
