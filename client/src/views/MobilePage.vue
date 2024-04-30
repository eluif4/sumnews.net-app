<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const componentKey = ref(true)

watch(() => route.path, () => {
    componentKey.value = !componentKey.value;
})
</script>

<template>
    <!-- FUTURE CHANGE: slide right when going deeper in the route and left when coming back up -->
    <transition name="srl" mode="out-in">
        <router-view></router-view>
    </transition>
    <!-- FUTURE CHANGE: only the first animation works but not the rest -->
    <transition name="slideupdown" mode="out-in">
        <router-view name="additional"></router-view>
    </transition>
    <transition name="fade">
        <router-view name="backdrop"></router-view>
    </transition>
</template>

<style scoped>
.srl-enter-active,
.srl-leave-active {
    animation: slide-in-right 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

.srl-enter-from,
.srl-leave-to {
    animation: slide-in-left 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
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
    transition: opacity 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0 cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
    ;
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
        -webkit-transform: translateY(0);
        transform: translateY(0);
        opacity: 1;
    }

    100% {
        -webkit-transform: translateY(1000px);
        transform: translateY(1000px);
        opacity: 1;
    }
}

@-webkit-keyframes slide-in-right {
    0% {
        -webkit-transform: translateX(1000px);
        transform: translateX(1000px);
        opacity: 0;
    }

    100% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slide-in-right {
    0% {
        -webkit-transform: translateX(1000px);
        transform: translateX(1000px);
        opacity: 0;
    }

    100% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
        opacity: 1;
    }
}

@-webkit-keyframes slide-in-left {
    0% {
        -webkit-transform: translateX(-1000px);
        transform: translateX(-1000px);
        opacity: 0;
    }

    100% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slide-in-left {
    0% {
        -webkit-transform: translateX(-1000px);
        transform: translateX(-1000px);
        opacity: 0;
    }

    100% {
        -webkit-transform: translateX(0);
        transform: translateX(0);
        opacity: 1;
    }
}
</style>