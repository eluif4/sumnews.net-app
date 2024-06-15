<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const componentKey = ref(true)
const isNavigatingForward = ref(true)

// Watch the route path to toggle the component key and determine the navigation direction
watch(() => route.path, (newPath, oldPath) => {
    componentKey.value = !componentKey.value
    const toDepth = newPath.split('/').length
    const fromDepth = oldPath.split('/').length
    isNavigatingForward.value = toDepth > fromDepth
})
</script>


<template>
    <!-- Use conditional class binding for transition name -->
    <transition :name="isNavigatingForward ? 'slide-right' : 'slide-left'" mode="out-in">
        <router-view :key="componentKey.value"></router-view>
    </transition>
    <!-- Additional transitions as needed -->
    <transition name="slideupdown" mode="out-in">
        <router-view name="additional"></router-view>
    </transition>
    <transition name="fade">
        <router-view name="backdrop"></router-view>
    </transition>
</template>


<style scoped>
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
    transition: transform 0.5s ease;
}

.slide-right-enter-from {
    transform: translateX(100%);
}

.slide-right-leave-to {
    transform: translateX(-100%);
}

.slide-left-enter-from {
    transform: translateX(-100%);
}

.slide-left-leave-to {
    transform: translateX(100%);
}

.slideupdown-enter-active,
.slideupdown-leave-active,
.slideupdown-in-bottom {
    animation: slide-in-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

.slideupdown-enter,
.slideupdown-leave-to,
.slideupdown-out-bottom {
    animation: slide-out-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@keyframes slide-in-bottom {
    0% {
        transform: translateY(1000px);
        opacity: 1;
    }

    100% {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes slide-out-bottom {
    0% {
        transform: translateY(0);
        opacity: 1;
    }

    100% {
        transform: translateY(1000px);
        opacity: 1;
    }
}
</style>
