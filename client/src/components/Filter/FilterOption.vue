<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
    option: {
        type: Object,
        required: true,
    }
});
const isChecked = ref(false) // v-model to state in checkbox input ( checked \ unchecked )
const localStorageKey = ref('') // 'genres' or 'sources' key depending if user is filtering SOURCE or GENRE
const arrayInLocalStorage = ref([]) // values of 'genres' or 'sources' in localStorage

// option.value = the value checked (either source value or genre value)
const option = computed(() => {
    if (props.option.genre) {
        localStorageKey.value = 'genres'
        return props.option.genre
    }
    else if (props.option.source)
        localStorageKey.value = 'sources'
    return props.option.source
})

onMounted(() => {
    // Connects the checked state of an input to the values in localStorage ( both for 'genres' and for 'sources' )
    // EXPLANATION: if 'sources' localstorage = ['foxnews.com', 'msn.com', 'nypost.com'], then those input values will be checked

    for (const valInLocalStorage of JSON.parse(localStorage.getItem(localStorageKey.value)) || []) {
        if (valInLocalStorage == option.value)
            isChecked.value = true
    }
})

watch(isChecked, (newVal, oldVal) => { // Watch for when input is checked \ unchecked
    arrayInLocalStorage.value = JSON.parse(localStorage.getItem(localStorageKey.value)) || []

    if (newVal) { // If is checked
        if (!arrayInLocalStorage.value.includes(option.value)) { // Only add values to localStorage if they arent in localStorage
            arrayInLocalStorage.value.push(option.value)
            localStorage.setItem(localStorageKey.value, JSON.stringify(arrayInLocalStorage.value))
        }
    } else { // If is unchecked
        arrayInLocalStorage.value = arrayInLocalStorage.value.filter(item => item !== option.value)
        localStorage.setItem(localStorageKey.value, JSON.stringify(arrayInLocalStorage.value))
    }
})

function capitalize(string) {
    if (!string)
        return string; // Handle empty or null string
    return string.charAt(0).toUpperCase() + string.slice(1);
}
</script>

<template>
    <div class="checkbox-wrapper-47" @click="inputClick">
        <input type="checkbox" name="cb" :id="`cb-${props.option._id}`" v-model="isChecked" />
        <label :for="`cb-${props.option._id}`">{{ capitalize(option) }}</label>
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
}

.checkbox-wrapper-47 label,
.checkbox-wrapper-47 label::before {
    transition: 0.25s all ease;
}
</style>