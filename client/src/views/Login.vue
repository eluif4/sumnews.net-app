<script setup>
import SignInUsing from '../components/SignInUsing/SignInUsing.vue';
import { signInWithGoogle } from '../scripts/signIn';
import router from '../router/index'
import { showPopup } from '../scripts/utility';

const googlePlatform = {
    text: "Continue with Google",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><g clip-path="url(#clip0_4773_1172)"><path d="M8.36104 0.789433C5.96307 1.62131 3.89506 3.20024 2.46077 5.29431C1.02649 7.38838 0.301526 9.8872 0.392371 12.4237C0.483217 14.9603 1.38508 17.4008 2.9655 19.3869C4.54591 21.373 6.72158 22.8 9.17292 23.4582C11.1603 23.971 13.2424 23.9935 15.2404 23.5238C17.0504 23.1173 18.7238 22.2476 20.0967 21.0001C21.5256 19.662 22.5627 17.9597 23.0967 16.0763C23.6768 14.0282 23.7801 11.8743 23.3985 9.78006H12.2385V14.4094H18.7017C18.5725 15.1478 18.2957 15.8525 17.8878 16.4814C17.48 17.1102 16.9494 17.6504 16.3279 18.0694C15.5388 18.5917 14.6491 18.943 13.716 19.1007C12.7803 19.2747 11.8205 19.2747 10.8848 19.1007C9.93633 18.9048 9.03912 18.5134 8.25042 17.9513C6.9832 17.0543 6.03168 15.7799 5.53167 14.3101C5.02333 12.8126 5.02333 11.1893 5.53167 9.69193C5.88759 8.64234 6.47598 7.68669 7.25292 6.89631C8.14203 5.97521 9.26766 5.3168 10.5063 4.99333C11.745 4.66985 13.0488 4.6938 14.2748 5.06256C15.2325 5.35641 16.1083 5.87008 16.8323 6.56256C17.561 5.83756 18.2885 5.11068 19.0148 4.38193C19.3898 3.99006 19.7985 3.61693 20.1679 3.21568C19.0627 2.18728 17.7654 1.387 16.3504 0.860683C13.7736 -0.0749616 10.9541 -0.100106 8.36104 0.789433Z" fill="white"/><path d="M8.3607 0.789367C10.9536 -0.100776 13.7731 -0.0762934 16.3501 0.858742C17.7653 1.38864 19.062 2.19277 20.1657 3.22499C19.7907 3.62624 19.3951 4.00124 19.0126 4.39124C18.2851 5.11749 17.5582 5.84124 16.832 6.56249C16.108 5.87001 15.2322 5.35635 14.2745 5.06249C13.0489 4.69244 11.7451 4.66711 10.5061 4.98926C9.26712 5.31141 8.14079 5.96861 7.2507 6.88874C6.47377 7.67912 5.88538 8.63477 5.52945 9.68437L1.64258 6.67499C3.03384 3.91604 5.44273 1.80566 8.3607 0.789367Z" fill="#E33629"/><path d="M0.611401 9.65605C0.820163 8.62063 1.16701 7.61792 1.64265 6.6748L5.52953 9.69168C5.02119 11.1891 5.02119 12.8124 5.52953 14.3098C4.23453 15.3098 2.9389 16.3148 1.64265 17.3248C0.452308 14.9554 0.0892746 12.2557 0.611401 9.65605Z" fill="#F8BD00"/><path d="M12.2381 9.77832H23.3981C23.7797 11.8726 23.6764 14.0264 23.0963 16.0746C22.5623 17.958 21.5252 19.6602 20.0963 20.9983C18.8419 20.0196 17.5819 19.0483 16.3275 18.0696C16.9494 17.6501 17.4802 17.1094 17.8881 16.4798C18.296 15.8503 18.5726 15.1448 18.7013 14.4058H12.2381C12.2363 12.8646 12.2381 11.3214 12.2381 9.77832Z" fill="#587DBD"/><path d="M1.64062 17.3251C2.93687 16.3251 4.2325 15.3201 5.5275 14.3101C6.02851 15.7804 6.98138 17.0549 8.25 17.9513C9.04116 18.5107 9.9403 18.899 10.89 19.0913C11.8257 19.2653 12.7855 19.2653 13.7213 19.0913C14.6543 18.9336 15.544 18.5823 16.3331 18.0601C17.5875 19.0388 18.8475 20.0101 20.1019 20.9888C18.7292 22.237 17.0558 23.1073 15.2456 23.5144C13.2476 23.9841 11.1655 23.9616 9.17813 23.4488C7.60632 23.0291 6.13814 22.2893 4.86563 21.2757C3.51886 20.2062 2.41882 18.8587 1.64062 17.3251Z" fill="#319F43"/></g><defs><clipPath id="clip0_4773_1172"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>`,
    signInFunction: signInWithGoogleHandler
}

const applePlatform = {
    text: "Continue with Apple",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17.0502 20.28C16.0702 21.23 15.0002 21.08 13.9702 20.63C12.8802 20.17 11.8802 20.15 10.7302 20.63C9.29016 21.25 8.53016 21.07 7.67016 20.28C2.79016 15.25 3.51016 7.59 9.05016 7.31C10.4002 7.38 11.3402 8.05 12.1302 8.11C13.3102 7.87 14.4402 7.18 15.7002 7.27C17.2102 7.39 18.3502 7.99 19.1002 9.07C15.9802 10.94 16.7202 15.05 19.5802 16.2C19.0102 17.7 18.2702 19.19 17.0402 20.29L17.0502 20.28ZM12.0302 7.25C11.8802 5.02 13.6902 3.18 15.7702 3C16.0602 5.58 13.4302 7.5 12.0302 7.25Z" fill="black"/></svg>`
}

const facebookPlatform = {
    text: "Continue with Google",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><g clip-path="url(#clip0_4773_1182)"><path d="M21.8715 0.905762H2.12965C1.45344 0.905762 0.905273 1.45393 0.905273 2.13014V21.872C0.905273 22.5482 1.45344 23.0964 2.12965 23.0964H21.8715C22.5477 23.0964 23.0959 22.5482 23.0959 21.872V2.13014C23.0959 1.45393 22.5477 0.905762 21.8715 0.905762Z" fill="#3D5A98"/><path d="M16.215 23.0943V14.5012H19.0987L19.53 11.1524H16.215V9.01494C16.215 8.04557 16.485 7.38369 17.8743 7.38369H19.6481V4.38369C18.7892 4.29418 17.926 4.25161 17.0625 4.25619C14.5087 4.25619 12.75 5.81244 12.75 8.68307V11.1524H9.86621V14.5012H12.75V23.0943H16.215Z" fill="white"/></g><defs><clipPath id="clip0_4773_1182"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>`
}

const SkipSignIn = {
    text: "Continue without Signing In",
    svg: ``,
    signInFunction: skipSignIn,
}

async function signInWithGoogleHandler() {
    try {
        await signInWithGoogle();
        router.push({ name: 'home' });
    } catch (error) {
        console.error('Failed to log user in', error);
        showPopup(1, 'Failed to log you in. Try again later');
        router.push({ name: 'home' });
    }
}
async function skipSignIn() {
    /* 
        Display modal that the user is missing out on core feautres like notifications and personalized feed
    */
    router.push({ name: 'home', query: { skip: true } });
}
</script>

<template>
    <div id="page">
        <div class="flexContainer">
            <img src="../assets/icons/sumnews.net_transparent.png" alt="Sumnews.net Logo" id="logo">
            <p class="title">Sumnews.net</p>
            <p class="subtitle">AI Powered News in 100 Words or Less</p>
        </div>
        <div class="flexContainer">
            <SignInUsing :platform="googlePlatform"></SignInUsing>
            <!-- <SignInUsing :platform="applePlatform"></SignInUsing> -->
            <!-- <SignInUsing :platform="facebookPlatform"></SignInUsing> -->
            <SignInUsing :platform="SkipSignIn"></SignInUsing>
        </div>
    </div>
</template>

<style scoped>
#page {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 120px;

    background: rgb(98, 254, 189);
    background: linear-gradient(0deg, rgba(98, 254, 189, 1) 0%, rgba(255, 255, 255, 1) 70%);
}

#logo {
    width: 150px;
    height: 150px;
}

.title {
    /* font-weight: bold; */
    font-size: 32px;
}

.subtitle {
    font-size: 24px;
    text-align: center;
    width: 70%;
}

.flexContainer {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}
</style>