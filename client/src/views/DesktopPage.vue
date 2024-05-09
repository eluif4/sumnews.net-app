<template>
    <div class="page">
        <div class="text">
            <h1>Oops! The Desktop Version of Sumnews Isn't Available Yet</h1>
            <p>We're working hard to bring it to you. Please check back later.</p>
            <p>In the meantime, you can explore Sumnews on your mobile device and explore all it has to offer</p>
        </div>
    </div>
</template>

<style scoped>
.page {
    height: 100vh;

    display: flex;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;
    background: linear-gradient(45deg, var(--main-color), #62FEBD33);
}

.text {
    width: fit-content;

    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;

    position: relative;
    z-index: 999;
    
    border-radius: var(--border-radius);;
    margin: auto;
    margin-right: 20px;
    margin-left: 20px;
    padding: 30px;

    background-color: rgba(240, 248, 255, 0.455);
    backdrop-filter: blur(5px);
    transform: scale(1);
    transition: all var(--transition-time) var(--transition-type);
    will-change: transform;
}


h1 {
    font-size: 48px
}

p {
    font-size: 24px;
}
</style>