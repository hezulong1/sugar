<script setup lang="ts">
import { ref } from 'vue'
import { CloseButton } from '../packages/sugar'

defineOptions({
  name: 'Site',
})

const figma = ref(false)
</script>

<template>
  <div>
    Hello World
    <input v-model="figma" type="checkbox">
    <CloseButton :figma="figma" />
  </div>
</template>

<style>
span {
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  vertical-align: inherit;
  outline: none;
  letter-spacing: inherit;
  text-decoration: none;
  cursor: inherit;
}
</style>
