<script setup>
import router from '../../router';
import { goBack } from '../../scripts/utility.js'
import { useRoute } from 'vue-router';
import { Filter } from '../../main.js'
const route = useRoute();

// // Values in localStorage on render
// const localStorageGenres = JSON.parse(localStorage.getItem('genres'));
// const localStorageSources = JSON.parse(localStorage.getItem('sources'));

function handleClick() {
    // Values in localStorage on click
    // const localStorageGenresAfterClick = JSON.parse(localStorage.getItem('genres'));
    // const localStorageSourcesAfterClick = JSON.parse(localStorage.getItem('sources'));

    // /*
    // If when backdrop is rendered both localstorages have different values (user didnt click apply), 
    // revert localstorage values to their previous ones
    // */
    // if (localStorageGenres != localStorageGenresAfterClick) {
    //     localStorage.setItem('genres', JSON.stringify(localStorageGenres));
    // }
    // if (localStorageSources != localStorageSourcesAfterClick) {
    //     localStorage.setItem('sources', JSON.stringify(localStorageSources));
    // }

    if (route.name == 'eventArticles') {
        router.push({ name: 'home' })
    } else if (Filter.isVisible) {
        !Filter.isVisible
    } else {
        goBack();
    }
}
</script>

<template>
    <div class="backdrop" @click="handleClick" v-if="Filter.isVisible || route.path.includes('article')"></div>
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