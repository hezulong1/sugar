<script setup lang="ts">
defineProps<{
  modelValue: boolean;

}>();

defineEmits<{
  'update:modelValue': (a: boolean) => void;
}>();

const model = defineModel<boolean>();

function toggle() {
  model.value = !model.value;
}
</script>

<template>
  <button role="switch" type="button" :aria-checked="model" @click="toggle">
    <slot />
    <span aria-hidden="true">On</span>
    <span aria-hidden="true">Off</span>
  </button>
</template>
