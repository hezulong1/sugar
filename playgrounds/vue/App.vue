<script setup lang="ts">
import { ref } from 'vue';
import { useScrollbarState } from '@local/vue';

const delta = ref(0);

const arrowSize = ref(11.2);
const scrollbarSize = ref(10);
const oppositeScrollbarSize = ref(10);
const visibleSize = ref(300.5);
const scrollSize = ref(800.7);
const scrollPosition = ref(40.3);

const {
  rectangleLargeSize,
  rectangleSmallSize,
  isNeeded,
  sliderSize,
  sliderPosition,

  _sliderRadio,

  getDesiredScrollPositionFromOffset,
  getDesiredScrollPositionFromOffsetPaged,
  getDesiredScrollPositionFromDelta,
} = useScrollbarState(arrowSize, scrollbarSize, oppositeScrollbarSize, visibleSize, scrollSize, scrollPosition);

</script>

<template>
  <p>_sliderRadio: {{ _sliderRadio }}</p>
  <p>arrowSize: {{ arrowSize }} <input v-model="arrowSize" type="number" min="0"></p>
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
