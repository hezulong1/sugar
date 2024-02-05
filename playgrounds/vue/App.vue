<script setup lang="ts">
import { ScrollbarArrow, ArrowUp, ArrowDown, useScrollbarVisiblityController, ScrollbarVisibility, useScrollbarState } from '@local/vue';
import { ref } from 'vue';

const visibility = ref(ScrollbarVisibility.Auto);
const visibleClassName = ref('scrollbar visible');
const invisibleClassName = ref('scrollbar invisible');
const shouldBeVisible = ref(false);

const { setIsNeeded, setShouldBeVisible, isVisible, className } = useScrollbarVisiblityController(visibility, visibleClassName, invisibleClassName);

function handleActivate(type: string) {
  // eslint-disable-next-line no-console
  console.log('handleActivate' + type);
}

function handleClick() {
  shouldBeVisible.value = !shouldBeVisible.value;
  setShouldBeVisible(shouldBeVisible.value);
}

function handleChange(e: Event) {
  if (!e || !(e.target instanceof HTMLInputElement)) return;
  setIsNeeded(e.target.checked);
}

const arrowSize = ref(12);
const scrollbarSize = ref(12);
const oppositeScrollbarSize = ref(12);
const visibleSize = ref(298.56);
const scrollSize = ref(403.32);
const scrollPosition = ref(34.21);

const scrollbarState = useScrollbarState(
  arrowSize,
  scrollbarSize,
  oppositeScrollbarSize,
  visibleSize,
  scrollSize,
  scrollPosition,
);

const delta = ref(0);
const position = scrollbarState.getDesiredScrollPositionFromDelta(delta);
</script>

<template>
  <div style="position: relative; block-size: 16px; inline-size: 16px; margin-block-end: 20px;">
    <ScrollbarArrow class-name="scra" :bg-width="11" :bg-height="11" @activate="handleActivate('Up')">
      <ArrowUp />
    </ScrollbarArrow>
  </div>

  <div style="position: relative; block-size: 16px; inline-size: 16px; ">
    <ScrollbarArrow class-name="scra" :bg-width="11" :bg-height="11" @activate="handleActivate('Down')">
      <ArrowDown />
    </ScrollbarArrow>
  </div>

  <br>
  <details>
    <summary>useScrollbarVisiblityController</summary>
    visibility: {{ visibility }}<br>
    className: {{ className }}<br>
    isVisible: {{ isVisible }}<br>
    <p>
      visibleClassName: <input v-model="visibleClassName">
      invisibleClassName: <input v-model="invisibleClassName">
    </p>
    <select v-model="visibility">
      <option :value="ScrollbarVisibility.Auto">{{ ScrollbarVisibility.Auto }}</option>
      <option :value="ScrollbarVisibility.Hidden">{{ ScrollbarVisibility.Hidden }}</option>
      <option :value="ScrollbarVisibility.Visible">{{ ScrollbarVisibility.Visible }}</option>
    </select>
    <button type="button" @click="handleClick">shouldBeVisible: {{ shouldBeVisible ? 'On' : 'Off' }}</button>
    <label for="isNeeded"><small>isNeeded:</small></label><input id="isNeeded" type="checkbox" @change="handleChange">
  </details>

  <br>
  <details open>
    <summary>useScrollbarState</summary>
    arrowSize: <input v-model="arrowSize" type="number"><br>
    scrollbarSize: <input v-model="scrollbarSize" type="number"><br>
    oppositeScrollbarSize: <input v-model="oppositeScrollbarSize" type="number"><br>
    visibleSize: <input v-model="visibleSize" type="number" step="0.01"><br>
    scrollSize: <input v-model="scrollSize" type="number" step="0.01"><br>
    scrollPosition: <input v-model="scrollPosition" type="number" step="0.01"><br>
    delta: <input v-model="delta" type="number"><br>
    <br>
    {{ position }}
  </details>
</template>
