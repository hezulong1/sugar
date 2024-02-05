<script setup lang="ts">
import { computed, ref } from 'vue-demi';
import type { ScrollableElementCreationOptions } from './scrollableElementOptions';
import Scrollbar from './scrollbar.vue';
import { ScrollbarVisibility } from './scrollable';

const props = defineProps<ScrollableElementCreationOptions>();

const arrowSize = computed(() => typeof props.arrowSize !== 'undefined' ? props.arrowSize : 11);

const horizontal = computed(() => typeof props.horizontal !== 'undefined' ? props.horizontal : ScrollbarVisibility.Auto);
const horizontalScrollbarSize = computed(() => typeof props.horizontalScrollbarSize !== 'undefined' ? props.horizontalScrollbarSize : 10);
const horizontalSliderSize = computed(() => typeof props.horizontalSliderSize !== 'undefined' ? props.horizontalSliderSize : horizontalScrollbarSize.value);
const horizontalHasArrows = computed(() => props.horizontalHasArrows);

const vertical = computed(() => typeof props.vertical !== 'undefined' ? props.vertical : ScrollbarVisibility.Auto);
const verticalScrollbarSize = computed(() => typeof props.verticalScrollbarSize !== 'undefined' ? props.verticalScrollbarSize : 10);
const verticalSliderSize = computed(() => typeof props.verticalSliderSize !== 'undefined' ? props.verticalSliderSize : verticalScrollbarSize.value);
const verticalHasArrows = computed(() => props.verticalHasArrows);

const isDragging = ref(false);
const mouseIsOver = ref(false);
</script>

<template>
  <div class="monaco-scrollable-element" role="presentation" style="position: relative; overflow: hidden;">
    <Scrollbar
      :visibility="horizontal"
      :has-arrows="horizontalHasArrows"
      :arrow-size="arrowSize"
      :scrollbar-size="horizontalScrollbarSize"
      :opposite-scrollbar-size="verticalScrollbarSize"
      :slider-size="horizontalSliderSize"
    />
    <Scrollbar
      vertical
      :visibility="vertical"
      :has-arrows="verticalHasArrows"
      :arrow-size="arrowSize"
      :scrollbar-size="verticalScrollbarSize"
      :opposite-scrollbar-size="horizontalScrollbarSize"
      :slider-size="verticalSliderSize"
    />
  </div>
</template>
