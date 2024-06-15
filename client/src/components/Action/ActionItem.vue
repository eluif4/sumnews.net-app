<script setup>
const props = defineProps({
    action: {
        type: Object,
        required: true,
    },
    article: {
        type: Object,
        required: true,
    }
});

const { svg, actionFunction, strokeColor } = props.action;
const handleAction = () => {
    props.action.actionFunction(props.article)
}
</script>

<template>
    <div v-html="svg" v-if="svg" @click.stop.prevent="handleAction" :style="{ stroke: strokeColor}"></div>
</template>