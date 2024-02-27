<script setup lang="ts">
import { ref } from 'vue';
import { useScrollable, type ScrollEvent } from './hook';

const result = ref('');

const forceIntegerValues = ref(true);
const smoothScrollDuration = ref(2000);
const width = ref(320);
const scrollWidth = ref(400);
const scrollLeft = ref(0);
const height = ref(280);
const scrollHeight = ref(8000);
const scrollTop = ref(60);

const startScrollTop = ref(0);
const startScrollLeft = ref(0);

const onScroll = (e: ScrollEvent) => {
  result.value = JSON.stringify(e, null, 2);
  startScrollTop.value = e.scrollTop;
  startScrollLeft.value = e.scrollLeft;
};

const trigger = useScrollable(
  onScroll,
  forceIntegerValues.value,
  smoothScrollDuration,
  width,
  scrollWidth,
  startScrollLeft,
  height,
  scrollHeight,
  startScrollTop,
);

function onAdd() {
  console.log('onAdd');
  trigger({ scrollLeft: startScrollLeft.value || scrollLeft.value, scrollTop: startScrollTop.value || scrollTop.value });
}

function onReset() {
  startScrollTop.value = 0;
  startScrollLeft.value = 0;
}

</script>

<template>
  <div>smoothScrollDuration: <input v-model="smoothScrollDuration" type="number" min="0" max="125"><input v-model="forceIntegerValues" type="checkbox"></div>

  <br>

  <label>width: <input v-model="width" type="number" step="0.1" min="0"></label>
  <label>scrollWidth: <input v-model="scrollWidth" type="number" step="0.1" min="0"></label>
  <label>scrollLeft: <input v-model="scrollLeft" type="number" step="0.1" min="0"></label>

  <br>

  <label>height: <input v-model="height" type="number" step="0.1" min="0"></label>
  <label>scrollHeight: <input v-model="scrollHeight" type="number" step="0.1" min="0"></label>
  <label>scrollTop: <input v-model="scrollTop" type="number" step="0.1" min="0"></label>

  <br>
  <div>
    {{ startScrollTop }}
  </div>
  <button type="button" @click="onAdd">+</button>
  <button type="button" @click="onReset">R</button>
  <br>
  <textarea v-model="result" style="margin-top: 20px; width: 340px; height: 320px" />
</template>
