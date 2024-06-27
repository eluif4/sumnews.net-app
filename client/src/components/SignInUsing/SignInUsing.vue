<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    platform: {
        type: Object,
        required: true,
    },
});

const { text, svg, signInFunction } = props.platform;
</script>

<template>
    <div class="signIn" :class="{ 'skip': !svg }" @click="signInFunction">
        <p class="text">{{ text }}</p>
        <div v-html="svg" v-if="svg"></div>
    </div>
</template>

<style scoped>
.signIn {
    /* width: 70%; */
    min-width: fit-content;
    padding: 15px;

    color: black;
    text-align: center;

    display: flex;
    flex-direction: row;
    /* justify-content: space-evenly; */
    justify-content: center;
    align-items: center;
    gap: 20px;

    border: 2px solid black;
    border-radius: 20px;
    
    background-color: white;
}

.skip {
    background-color: black;
    color: #62FEBD;
    font-weight: bold;
}

.text {
    font-size: 1.3em;
}
</style>