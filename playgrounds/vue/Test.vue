<script setup lang="ts">
import { ref } from 'vue';
import { useTest } from './hook';

const msg = ref('');
const test = useTest({ msg });
</script>

<template>
  <div>
    <input v-model="msg"><br>
    <span>{{ test }}</span>
  </div>
</template>
