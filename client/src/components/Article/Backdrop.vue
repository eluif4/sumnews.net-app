<script setup>
import { goBack } from '../../scripts/utility.js'
</script>

<template>
    <!-- <div class="backdrop" @click="goBack"></div> -->
    <router-link to="/" class="backdrop"></router-link>
</template>

<style scoped>
.backdrop {
    height: 100%;
    width: 100%;
    position: absolute;
    bottom: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 150;
    backdrop-filter: blur(3px);
}
</style>