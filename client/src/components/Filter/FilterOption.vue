<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    filterOption: {
        type: Object,
        required: true,
    },
    isChecked: {
        type: Boolean,
        default: false,
    }
});

const isChecked = ref(false);
const genre = computed(() => props.filterOption.genre);
const source = computed(() => props.filterOption.source);
</script>

<!-- FUTURE CHANGE: unbind inputs in source and genre -->
<template>
    <div class="checkbox-wrapper-47">
        <input type="checkbox" name="cb" :id="`cb-${props.filterOption._id}`" v-model="filterOption.isChecked"/>
        <label :for="`cb-${props.filterOption._id}`">{{ genre ? genre : source }}</label>
    </div>
</template>

<style>
.checkbox-wrapper-47 {
    width: 100%;
    padding: 2px 0;
}

.checkbox-wrapper-47 input[type="checkbox"] {
    display: none;
    visibility: hidden;
}

.checkbox-wrapper-47 label {
    position: relative;
    padding-left: 2em;
    padding-right: 1em;
    line-height: 2;
    cursor: pointer;
    display: inline-flex;
    width: 100%;
}

.checkbox-wrapper-47 label:before {
    box-sizing: border-box;
    content: " ";
    position: absolute;
    top: 0.3em;
    left: 0;
    display: block;
    width: 1.4em;
    height: 1.4em;
    border: 2px solid #9098A9;
    border-radius: 6px;
    z-index: -1;
}

.checkbox-wrapper-47 input[type=checkbox]:checked+label {
    padding-left: 1em;
    color: #0f5229;
}

.checkbox-wrapper-47 input[type=checkbox]:checked+label:before {
    top: 0;
    width: 100%;
    height: 2em;
    background: var(--main-color);
    border-color: black;
    /* background: #b7e6c9; */
    /* border-color: #2cbc63; */
}

.checkbox-wrapper-47 label,
.checkbox-wrapper-47 label::before {
    transition: 0.25s all ease;
}
</style>