<script setup lang="ts">
import { ref } from 'vue';
import { useScrollbarState } from '@local/vue';

const delta = ref(0);

const {
  arrowSize,
  scrollbarSize,
  oppositeScrollbarSize,
  visibleSize,
  scrollSize,
  scrollPosition,

  rectangleLargeSize,
  rectangleSmallSize,
  isNeeded,
  sliderSize,
  sliderPosition,

  getDesiredScrollPositionFromOffset,
  getDesiredScrollPositionFromOffsetPaged,
  getDesiredScrollPositionFromDelta,
} = useScrollbarState(11.2, 300.8, 12.4, 300.4, 8000.5, 40.3);

</script>

<template>
  <p>arrowSize: {{ arrowSize }}</p>
  <p>scrollbarSize: {{ scrollbarSize }} <input v-model="scrollbarSize" type="number" step="0.1" min="0"></p>
  <p>oppositeScrollbarSize: {{ oppositeScrollbarSize }} <input v-model="oppositeScrollbarSize" type="number" step="0.1" min="0"></p>
  <p>visibleSize: {{ visibleSize }} <input v-model="visibleSize" type="number" step="0.1" min="0"></p>
  <p>scrollSize: {{ scrollSize }} <input v-model="scrollSize" type="number" step="0.1" min="0"></p>
  <p>scrollPosition: {{ scrollPosition }} <input v-model="scrollPosition" type="number" step="0.1" min="0"></p>
  <hr>
  <p>rectangleLargeSize: {{ rectangleLargeSize }}</p>
  <p>rectangleSmallSize: {{ rectangleSmallSize }}</p>
  <p>isNeeded: {{ isNeeded }}</p>
  <p>sliderSize: {{ sliderSize }}</p>
  <p>sliderPosition: {{ sliderPosition }}</p>
  <hr>
  <p><input v-model="delta" type="number" step="1" min="0"></p>
  <p>getDesiredScrollPositionFromOffset: {{ getDesiredScrollPositionFromOffset(delta) }}</p>
  <p>getDesiredScrollPositionFromOffsetPaged: {{ getDesiredScrollPositionFromOffsetPaged(delta) }}</p>
  <p>getDesiredScrollPositionFromDelta: {{ getDesiredScrollPositionFromDelta(delta) }}</p>
</template>
