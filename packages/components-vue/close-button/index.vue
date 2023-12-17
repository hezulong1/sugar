<script setup lang="ts">
import CarbonCloseLarge from '../icons/CarbonCloseLarge.vue'
import FigmaClose from '../icons/FigmaClose.vue'

defineProps<{
  figma?: boolean
}>()
</script>

<template>
  <button class="close-button" type="button" aria-label="Close">
    <span class="icon">
      <FigmaClose v-if="figma" />
      <CarbonCloseLarge v-else />
      <!-- <svg v-else width="18" height="18" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg> -->
    </span>
  </button>
</template>
