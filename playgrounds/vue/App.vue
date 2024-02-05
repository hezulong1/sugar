<script setup lang="ts">
import { ScrollableElement } from '@local/vue';
</script>

<template>
  <ScrollableElement class="container">
    <div class="monaco-list-rows">
      <div v-for="i in 350" :key="i" :style="`width: 350px; margin-block: 2px; border: ${ i % 2 ? '1px solid blue' : '1px solid red' }`">i</div>
    </div>
  </ScrollableElement>
</template>
