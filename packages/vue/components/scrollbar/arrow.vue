<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core';
import type { CSSProperties } from 'vue-demi';
import { computed } from 'vue-demi';

const props = defineProps<{
  className: string;
  bgWidth: number;
  bgHeight: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}>();

const emit = defineEmits<{
  (e: 'activate'): void;
}>();

const ARROW_IMG_SIZE = 11;

const bgStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
    width: props.bgWidth + 'px',
    height: props.bgHeight + 'px',
  };

  if (typeof props.top !== 'undefined') {
    s.top = '0px';
  }

  if (typeof props.right !== 'undefined') {
    s.right = '0px';
  }

  if (typeof props.bottom !== 'undefined') {
    s.bottom = '0px';
  }

  if (typeof props.left !== 'undefined') {
    s.left = '0px';
  }

  return s;
});

const arrowStyle = computed<CSSProperties>(() => {
  const s: CSSProperties = {
    position: 'absolute',
    width: ARROW_IMG_SIZE + 'px',
    height: ARROW_IMG_SIZE + 'px',
  };

  if (typeof props.top !== 'undefined') {
    s.top = props.top + 'px';
  }

  if (typeof props.right !== 'undefined') {
    s.right = props.right + 'px';
  }

  if (typeof props.bottom !== 'undefined') {
    s.bottom = props.bottom + 'px';
  }

  if (typeof props.left !== 'undefined') {
    s.left = props.left + 'px';
  }

  return s;
});

const { pause, resume, isActive } = useIntervalFn(() => emit('activate'), 1000 / 24, { immediate: false, immediateCallback: false });

let token: ReturnType<typeof setTimeout> = -1;
function onPointerDown(e: PointerEvent) {
  if (!e.target || !(e.target instanceof HTMLElement)) return;

  emit('activate');

  if (isActive.value) {
    pause();
  }

  if (token !== -1) {
    clearTimeout(token);
    token = -1;
  }

  token = setTimeout(resume, 200);

  e.preventDefault();
}

function onPointerup(e: PointerEvent) {
  pause();

  if (token !== -1) {
    clearTimeout(token);
    token = -1;
  }
}
</script>

<template>
  <div class="arrow-background" :style="bgStyle" @pointerdown="onPointerDown" @pointerup="onPointerup" />
  <div :class="className" :style="arrowStyle" @pointerdown="onPointerDown" @pointerup="onPointerup"><slot /></div>
</template>
