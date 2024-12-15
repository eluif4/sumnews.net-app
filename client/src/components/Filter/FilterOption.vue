<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

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
        return { baseValue: props.option.genre, displayValue: props.option.genre }
    }
    else if (props.option.source) {
        localStorageKey.value = 'sources'
        return { baseValue: props.option.source, displayValue: props.option.sourceName }
    }
})

onMounted(() => {
    // Connects the checked state of an input to the values in localStorage ( both for 'genres' and for 'sources' )
    // EXPLANATION: if 'sources' localstorage = ['foxnews.com', 'msn.com', 'nypost.com'], then those input values will be checked
    const valuesInLocalStorage = JSON.parse(localStorage.getItem(localStorageKey.value));
    if (valuesInLocalStorage.length > 0) {
        for (const valInLocalStorage of JSON.parse(localStorage.getItem(localStorageKey.value)) || []) { // Update to for val in query
            // if (localStorageKey.value == 'sources') {
            //     if (valInLocalStorage == option.value.name)
            //         isChecked.value = true
            // } else {
            if (valInLocalStorage == option.value.baseValue)
                isChecked.value = true
            // }
        }
    } else {
        // const valuesInQuery = localStorageKey.value == 'genres' ? route.query.genres : route.query.sources;
        const valuesInQuery = (route.query.genres + ',' + route.query.sources).split(',');
        for (const value of valuesInQuery || []) {
            if (value == option.value.baseValue) {
                isChecked.value = true;
            }
        }
    }
})

watch(isChecked, (newVal, oldVal) => { // Watch for when input is checked \ unchecked
    arrayInLocalStorage.value = JSON.parse(localStorage.getItem(localStorageKey.value)) || []

    if (newVal) { // If is checked
        if (!arrayInLocalStorage.value.includes(option.value.baseValue)) { // Only add values to localStorage if they arent in localStorage
            // if (localStorageKey.value == 'sources') { // If the filter is a 'source', filter using .source instead of .sourceName
            //     var sourceOption = props.option.source
            //     arrayInLocalStorage.value.push(sourceOption)
            //     localStorage.setItem(localStorageKey.value, JSON.stringify(arrayInLocalStorage.value))
            // } else {
            arrayInLocalStorage.value.push(option.value.baseValue)
            localStorage.setItem(localStorageKey.value, JSON.stringify(arrayInLocalStorage.value))
            // }
        }
    } else { // If is unchecked
        arrayInLocalStorage.value = arrayInLocalStorage.value.filter(item => item !== option.value.baseValue)
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
        <label :for="`cb-${props.option._id}`">{{ capitalize(option.displayValue) }}</label>
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