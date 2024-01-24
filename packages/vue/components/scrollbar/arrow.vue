<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';
import { useTimeoutFn } from '@vueuse/shared';

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

let pointerdownRepeatTimer = useIntervalFn(() => {

});

let pointerdownRepeatTimer = new IntervalTimer();
let pointerdownScheduleRepeatTimer = new TimeoutTimer();

tryOnScopeDispose(() => {
  pointerdownRepeatTimer.dispose();
  pointerdownScheduleRepeatTimer.dispose();
});

function onPointerDown(e: PointerEvent) {
  if (!e.target || !(e.target instanceof Element)) return;

  const scheduleRepeater = () => {
    pointerdownRepeatTimer.cancelAndSet(() => emit('activate'), 1000 / 24);
  };

  emit('activate');
  pointerdownRepeatTimer.cancel();

  useTimeoutFn();
  pointerdownScheduleRepeatTimer.cancelAndSet(scheduleRepeater, 200);

  e.preventDefault();
}
</script>

<template>
  <div class="arrow-background" :style="bgStyle" @pointerdown="onPointerDown" />
  <div :class="className" :style="arrowStyle" @pointerdown="onPointerDown"><slot /></div>
</template>
