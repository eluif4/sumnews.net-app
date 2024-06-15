<script setup>
import router from '../../router';
import { goBack } from '../../scripts/utility.js'
import { useRoute } from 'vue-router';
const route = useRoute();

function handleClick() {
    if (route.name == 'eventArticles') {
        router.push({ name: 'home' })
    } else {
        goBack();
    }
}
</script>

<template>
    <div class="backdrop" @click="handleClick"></div>
    <!-- <router-link to="/" class="backdrop"></router-link> -->
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