<script setup>
const props = defineProps({
    action: {
        type: Object,
        required: true,
    },
});

const { svg, actionFunction, strokeColor } = props.action;
</script>

<template>
    <div v-html="svg" v-if="svg" @click.stop.prevent="actionFunction" :style="{ stroke: strokeColor}"></div>
</template>