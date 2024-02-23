<script setup lang="ts">
import type { ScrollEvent } from '@local/vue';
import { ScrollableElement, useScrollable, scheduleAtNextAnimationFrame } from '@local/vue';

const onScroll = (e: ScrollEvent) => {
  console.log(e);
};
const scrollable = useScrollable({
  onScroll,
  scheduleAtNextAnimationFrame,
  smoothScrollDuration: 125,
});

scrollable.setScrollDimensions({
  width: 320,
  height: 200,
  scrollWidth: 400,
  scrollHeight: 1200,
}, false);
scrollable.setScrollPositionSmooth({ scrollTop: 200 });
</script>

<template>
  <ScrollableElement class="container">
    <div class="monaco-list-rows">
      <div v-for="i of 100" :key="i" :style="`width: 350px; margin-block: 2px; border: ${ i % 2 ? '1px solid blue' : '1px solid red' }`">{{ i }}</div>
    </div>
  </ScrollableElement>
</template>
