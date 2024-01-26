<script setup lang="ts">
import { ScrollbarArrow } from '@local/vue';

function handleActivate() {
  console.log('handleActivate');
}
</script>

<template>
  <ScrollbarArrow class-name="scra scra-h-start" :bg-width="11" :bg-height="11" @activate="handleActivate">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.4405 2L11.0002 2.41344L11.0002 13.6067L10.461 14L5.00024 8.37311L5.00024 7.54622L10.4405 2Z" fill="#424242" />
    </svg>
  </ScrollbarArrow>
</template>
