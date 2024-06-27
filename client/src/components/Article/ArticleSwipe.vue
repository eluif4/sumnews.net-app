<script setup>
import { computed, watch } from 'vue'
const props = defineProps({ action: Object, opacity: Number })

// Access props directly to maintain reactivity
const color = computed(() => props.action.color)
const svg = computed(() => props.action.svg)
const direction = computed(() => props.action.direction)
</script>

<template>
    <div class="swipe-container" :style="{ backgroundColor: color, opacity: props.opacity }" :class="direction">
        <div class="svg-container" v-html="svg" :style="{ opacity: props.opacity }"></div>
    </div>
</template>

<style scoped>
.swipe-container {
  height: 100%;
  width: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  bottom: 0;
}

.right {
  right: 100%;
}

.left {
  left: 100%;
}

.svg-container {
  width: 30px;
  height: 30px;
}
</style>