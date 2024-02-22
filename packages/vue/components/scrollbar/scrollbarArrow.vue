<script setup lang="ts">
import { useIntervalFn, useTimeoutFn, noop } from '@vueuse/core';
import { type CSSProperties, computed } from 'vue-demi';
import { usePointerMove } from '../../hooks/usePointerMove';
import { ARROW_IMG_SIZE, type ScrollbarArrowOptions, type ScrollbarArrowEmits } from './scrollbarArrow';

const props = defineProps<ScrollbarArrowOptions>();
const emit = defineEmits<ScrollbarArrowEmits>();

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

const pointerMoveMonitor = usePointerMove();
const repeatTimer = useIntervalFn(() => emit('activate'), 1000 / 24, { immediate: false, immediateCallback: false });
const scheduleRepeatTimer = useTimeoutFn(repeatTimer.resume, 200, { immediate: false });

function onPointerDown(e: PointerEvent) {
  if (!e.target || !(e.target instanceof Element)) return;

  emit('activate');

  if (repeatTimer.isActive.value) repeatTimer.pause();
  if (scheduleRepeatTimer.isPending.value) scheduleRepeatTimer.stop();

  scheduleRepeatTimer.start();
  pointerMoveMonitor.start(e.target, e.pointerId, e.buttons, noop, () => {
    repeatTimer.pause();
    scheduleRepeatTimer.stop();
  });

  e.preventDefault();
}
</script>

<template>
  <div class="arrow-background" :style="bgStyle" @pointerdown="onPointerDown" />
  <div :class="$attrs.class" :style="arrowStyle" @pointerdown="onPointerDown"><slot /></div>
</template>
