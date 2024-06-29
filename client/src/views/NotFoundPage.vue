<script setup>
import router from '../router';
</script>

<template>
    <div class="container">
        <span class="title">Whoops! Seems like the page you are looking for doesn't exist</span>
        <p class="subtext">Sorr but it looks like something went wrong, please try again or return to the home page</p>
        <br>
        <button @click="router.push({ name: 'home' })" class="btn">Back to home page</button>
    </div>
</template>

<style scoped>
.container {
    width: 100%;
    height: 100%;

    box-sizing: border-box;
    padding: 15px;
    
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    /* gap: 15%; */
    position: relative;
    background: linear-gradient(181deg, #62febd, #cefae7);
    background-size: 400% 400%;

    -webkit-animation: backgroundMovement 4s ease infinite;
    -moz-animation: backgroundMovement 4s ease infinite;
    animation: backgroundMovement 4s ease infinite;
}

.title {
    color: var(--browser-background-color);
    font-size: 30px;
    font-weight: bold;
    text-align: center;
}

.subtext {
    text-align: center;
}

.logo {
    text-decoration: none;
    background-color: black;
    color: white;
    padding: 10%;
    box-shadow: 0 0 10px 0px var(--browser-background-color);
    border-radius: var(--border-radius);;
}

@-webkit-keyframes backgroundMovement {
    0% {
        background-position: 97% 0%
    }

    50% {
        background-position: 4% 100%
    }

    100% {
        background-position: 97% 0%
    }
}

@-moz-keyframes backgroundMovement {
    0% {
        background-position: 97% 0%
    }

    50% {
        background-position: 4% 100%
    }

    100% {
        background-position: 97% 0%
    }
}

@keyframes backgroundMovement {
    0% {
        background-position: 97% 0%
    }

    50% {
        background-position: 4% 100%
    }

    100% {
        background-position: 97% 0%
    }
}
</style>