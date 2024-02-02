<script setup lang="ts">
import { type CSSProperties, computed, ref } from 'vue-demi';
import type { ScrollbarOptions } from './scrollbar';

const props = defineProps<ScrollbarOptions>();

const scrollbarStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
  };
  return s;
});

function onPointerDown(e: PointerEvent) {
  //
}
</script>

<template>
  <div role="presentation" aria-hidden="true" :style="scrollbarStyle" @pointerdown="onPointerDown" />
</template>
