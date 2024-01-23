<script setup lang="ts">
import { computed, ref } from 'vue';
import { tryOnMounted, useEventListener } from '@vueuse/core';
import type { IMouseWheelEvent } from '../../utils/mouseEvent';

const props = defineProps<{
  listener?: Element;
}>();

const rootRef = ref<HTMLElement>();
const listenDomNode = computed(() => props.listener ?? rootRef.value);

function onMouseWheel(e: IMouseWheelEvent) {
  if (e.defaultPrevented) return;
}

tryOnMounted(() => {
  useEventListener(listenDomNode.value, 'wheel', onMouseWheel, { passive: false });
});
</script>

<template>
  <div ref="rootRef" class="SugarScrollbar-container" role="presentation" style="position: relative; overflow: hidden;">
    <slot />
  </div>
</template>
