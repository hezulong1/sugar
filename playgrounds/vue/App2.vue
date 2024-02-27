<script setup lang="ts">
import type { ScrollEvent } from '@local/vue';
import { ScrollableElement } from '@local/vue';
import type { CSSProperties } from 'vue';
import { onMounted, reactive, ref } from 'vue';

// import { useScrollState } from './hook';

const containerRef = ref<InstanceType<typeof ScrollableElement>>();
const contentRef = ref<HTMLElement>();
const contentStyle = reactive<CSSProperties>({
  top: '0px',
  left: '0px',
});

const forceIntegerValues = ref(true);
const smoothScrollDuration = ref(2000);

// let widthRef = ref(200.3);
// let scrollWidthRef = ref(400.8);
// let scrollLeftRef = 0.3;

// const scrollEvent = useScrollState(
//   forceIntegerValues.value,
//   widthRef,
//   scrollWidthRef,
//   scrollLeftRef,
// );

const onScroll = (e: ScrollEvent) => {
  if (e.scrollTopChanged) {
    contentStyle.top = -1 * e.scrollTop + 'px';
  }

  if (e.scrollLeftChanged) {
    contentStyle.left = -1 * e.scrollLeft + 'px';
  }
};

onMounted(update);

function update() {
  if (!containerRef.value) return;
  if (!contentRef.value) return;

  const { clientWidth, clientHeight } = containerRef.value.$el as HTMLElement;
  const { scrollWidth, scrollHeight } = contentRef.value;

  containerRef.value.setScrollDimensions({
    width: clientWidth,
    height: clientHeight,
    scrollWidth,
    scrollHeight,
  });
}

</script>

<template>
  <!--
    <input v-model="smoothScrollDuration" type="number" min="0" max="125">
    <input v-model="forceIntegerValues" type="checkbox">

    <br>

    <input v-model="widthRef" type="number" step="0.1" min="0">
    <input v-model="scrollWidthRef" type="number" step="0.1" min="0">
    <input v-model="scrollLeftRef" type="number" step="0.1" min="0">
    {{ scrollEvent }}
  -->
  <ScrollableElement ref="containerRef" class="container" :force-integer-values="forceIntegerValues" :smooth-scroll-duration="smoothScrollDuration" @scroll="onScroll">
    <div ref="contentRef" class="monaco-list-rows" :style="contentStyle">
      <div v-for="i of 100" :key="i" :style="`width: 350px; margin-block: 2px; border: ${ i % 2 ? '1px solid blue' : '1px solid red' }`">{{ i }}</div>
    </div>
  </ScrollableElement>
</template>
