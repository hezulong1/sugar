<script setup lang="ts">
import { ScrollbarArrow, ArrowUp, ArrowDown } from '@local/vue';

function handleActivate(type: string) {
  console.log('handleActivate' + type);
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
</template>
