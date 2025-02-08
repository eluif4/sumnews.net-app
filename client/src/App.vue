<script setup>
import { computed } from 'vue';
import DesktopPage from './views/DesktopPage.vue';
import MobilePage from './views/MobilePage.vue';

const isDesktop = computed(() => {
  return window.innerWidth > 768
})
</script>

<template>
  <div id="app">
    <DesktopPage v-if="isDesktop"></DesktopPage>
    <MobilePage v-else></MobilePage>
  </div>
</template>

<style>
#app {
  height: 100%;
  width: 100%;
  position: relative; /* Change from fixed */
  top: 0;
  left: 0;
  overflow: hidden;
  padding-top: (safe-area-inset-top);
  padding-bottom: (safe-area-inset-bottom);
}
</style>