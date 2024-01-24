<script lang="ts" setup>
import type { Component } from 'vue-demi';
import { ref, computed } from 'vue-demi';
import { KeyCode } from '../../utils/keyboard';

const props = withDefaults(defineProps<{
  as: string | Component;
  disabled?: boolean;
  openClass?: string;
  modelValue?: boolean | undefined;
  defaultChecked?: boolean | undefined;
}>(), {
  as: 'button',
  modelValue: void 0,
  defaultChecked: void 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'change', v: boolean): void;
}>();

defineExpose({
  toggle,
});

let internalChecked = ref(props.defaultChecked);
let isControlled = computed(() => typeof props.modelValue !== 'undefined');
let checked = computed(() => (isControlled.value ? props.modelValue : internalChecked.value));
let klass = computed(() => checked.value ? props.openClass : void 0);

function toggle() {
  const current = !checked.value;

  if (!isControlled.value) internalChecked.value = current;

  emit('update:modelValue', current);
  emit('change', current);
}

function handleClick(event: MouseEvent) {
  if (props.disabled) return;
  event.preventDefault();
  toggle();
}

function handleKeyup(event: KeyboardEvent) {
  if (props.disabled) return;
  if (event.key === KeyCode.Space) {
    event.preventDefault();
    toggle();
  } else if (event.key === KeyCode.Enter) {
    toggle();
  }
}
</script>

<template>
  <component :is="as" :class="klass" @click="handleClick" @keyup="handleKeyup" @keypress.prevent>
    <slot :checked="Boolean(checked)" />
  </component>
</template>
