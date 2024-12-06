<script setup>
import router from '../../router';
import { goBack } from '../../scripts/utility.js'
import { useRoute } from 'vue-router';
import { Filter } from '../../main.js'
const route = useRoute();

function handleClick() {


    if (route.name == 'eventArticles') {
        router.push({ name: 'home' })
    } else if (Filter.isVisible) {
        Filter.isVisible = !Filter.isVisible
    } else {
        goBack();
    }
}
</script>

<template>
    <div class="backdrop" @click="handleClick" v-if="Filter.isVisible || route.path.includes('article')"></div>
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