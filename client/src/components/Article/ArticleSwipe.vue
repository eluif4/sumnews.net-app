<script setup>
import { computed, watch } from 'vue'
const props = defineProps({ action: Object })

// Access props directly to maintain reactivity
const color = computed(() => props.action.color)
const svg = computed(() => props.action.svg)
const direction = computed(() => props.action.direction)
</script>

<template>
    <div class="swipe-container" :style="{ backgroundColor: color }" :class="direction">
        <div class="svg-container" v-html="svg"></div>
    </div>
</template>

<style scoped>
.swipe-container {
    height: 100%;
    width: 70%;
    transition: transform 0.1s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    bottom: 0;
    /* box-shadow: 0px 4px 10px 0px var(--browser-background-color); */
    background-color: transparent;
}

.right {
    left: 0;
    /* transform: translateX(-100%); */
}

.left {
    right: 0;
    /* transform: translateX(100%); */
}
</style>