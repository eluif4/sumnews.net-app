<script setup>
import { computed, onMounted } from 'vue'
import DesktopPage from './views/DesktopPage.vue'
import MobilePage from './views/MobilePage.vue'
// import { registerPushNotifications } from './main';

const isDesktop = computed(() => {
  return window.innerWidth > 768
})

// onMounted(async () => {
//   await registerPushNotifications();
//   console.log('onMounted finished');
// })
</script>

<template>
  <div id="app">
    <!-- <DesktopPage v-if="isDesktop"></DesktopPage> -->
    <!-- <MobilePage v-else></MobilePage> -->
     <MobilePage></MobilePage>
  </div>
</template>

<style>
#app {
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  overflow: hidden;
}
</style>