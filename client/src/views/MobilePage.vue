<template>
    <!-- <transition :name="transitionName" mode="out-in"> -->
    <router-view></router-view>
    <!-- </transition> -->

    <!-- Additional transitions as needed -->
    <router-view name="additional" v-slot="{ Component }">
        <transition name="slideupdown" mode="out-in">
            <component :is="Component" />
        </transition>
    </router-view>

    <router-view name="backdrop" v-slot="{ Component }">
        <transition name="fade">
            <component :is="Component" />
        </transition>
    </router-view>
</template>


<style scoped>
.slideupdown-enter-from,
.slideupdown-enter-active,
.slideupdown-enter-to {
    animation: slide-in-bottom 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
}

.slideupdown-leave-from,
.slideupdown-leave-active,
.slideupdown-leave-to {
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
