<script setup lang="ts">
import { ScrollbarArrow, ArrowUp, ArrowDown, useScrollbarVisiblityController, ScrollbarVisibility } from '@local/vue';
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
</template>
