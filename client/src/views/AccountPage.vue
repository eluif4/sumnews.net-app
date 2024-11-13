<script setup>
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { storeAuthToken, removeAuthToken } from '../scripts/utility';
import AccountPageItem from '../components/AccountPage/AccountPageItem.vue';
import PWA from '../components/PWA/PWA.vue';
import SignInUsing from '../components/SignInUsing/SignInUsing.vue';
import { config } from '../constants';
import router from '../router';
import { userProfile, registerPushNotificationsIfNeeded } from '../main';
import { INSTAGRAM, LINKEDIN, X } from '../scripts/socials';
import { showPopup } from '../scripts/utility';

const FRONTEND_URL = config.url.FRONTEND_URL;
const BACKEND_URL = config.url.BACKEND_URL;

const googlePlatform = {
    text: "Continue with Google",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><g clip-path="url(#clip0_4773_1172)"><path d="M8.36104 0.789433C5.96307 1.62131 3.89506 3.20024 2.46077 5.29431C1.02649 7.38838 0.301526 9.8872 0.392371 12.4237C0.483217 14.9603 1.38508 17.4008 2.9655 19.3869C4.54591 21.373 6.72158 22.8 9.17292 23.4582C11.1603 23.971 13.2424 23.9935 15.2404 23.5238C17.0504 23.1173 18.7238 22.2476 20.0967 21.0001C21.5256 19.662 22.5627 17.9597 23.0967 16.0763C23.6768 14.0282 23.7801 11.8743 23.3985 9.78006H12.2385V14.4094H18.7017C18.5725 15.1478 18.2957 15.8525 17.8878 16.4814C17.48 17.1102 16.9494 17.6504 16.3279 18.0694C15.5388 18.5917 14.6491 18.943 13.716 19.1007C12.7803 19.2747 11.8205 19.2747 10.8848 19.1007C9.93633 18.9048 9.03912 18.5134 8.25042 17.9513C6.9832 17.0543 6.03168 15.7799 5.53167 14.3101C5.02333 12.8126 5.02333 11.1893 5.53167 9.69193C5.88759 8.64234 6.47598 7.68669 7.25292 6.89631C8.14203 5.97521 9.26766 5.3168 10.5063 4.99333C11.745 4.66985 13.0488 4.6938 14.2748 5.06256C15.2325 5.35641 16.1083 5.87008 16.8323 6.56256C17.561 5.83756 18.2885 5.11068 19.0148 4.38193C19.3898 3.99006 19.7985 3.61693 20.1679 3.21568C19.0627 2.18728 17.7654 1.387 16.3504 0.860683C13.7736 -0.0749616 10.9541 -0.100106 8.36104 0.789433Z" fill="white"/><path d="M8.3607 0.789367C10.9536 -0.100776 13.7731 -0.0762934 16.3501 0.858742C17.7653 1.38864 19.062 2.19277 20.1657 3.22499C19.7907 3.62624 19.3951 4.00124 19.0126 4.39124C18.2851 5.11749 17.5582 5.84124 16.832 6.56249C16.108 5.87001 15.2322 5.35635 14.2745 5.06249C13.0489 4.69244 11.7451 4.66711 10.5061 4.98926C9.26712 5.31141 8.14079 5.96861 7.2507 6.88874C6.47377 7.67912 5.88538 8.63477 5.52945 9.68437L1.64258 6.67499C3.03384 3.91604 5.44273 1.80566 8.3607 0.789367Z" fill="#E33629"/><path d="M0.611401 9.65605C0.820163 8.62063 1.16701 7.61792 1.64265 6.6748L5.52953 9.69168C5.02119 11.1891 5.02119 12.8124 5.52953 14.3098C4.23453 15.3098 2.9389 16.3148 1.64265 17.3248C0.452308 14.9554 0.0892746 12.2557 0.611401 9.65605Z" fill="#F8BD00"/><path d="M12.2381 9.77832H23.3981C23.7797 11.8726 23.6764 14.0264 23.0963 16.0746C22.5623 17.958 21.5252 19.6602 20.0963 20.9983C18.8419 20.0196 17.5819 19.0483 16.3275 18.0696C16.9494 17.6501 17.4802 17.1094 17.8881 16.4798C18.296 15.8503 18.5726 15.1448 18.7013 14.4058H12.2381C12.2363 12.8646 12.2381 11.3214 12.2381 9.77832Z" fill="#587DBD"/><path d="M1.64062 17.3251C2.93687 16.3251 4.2325 15.3201 5.5275 14.3101C6.02851 15.7804 6.98138 17.0549 8.25 17.9513C9.04116 18.5107 9.9403 18.899 10.89 19.0913C11.8257 19.2653 12.7855 19.2653 13.7213 19.0913C14.6543 18.9336 15.544 18.5823 16.3331 18.0601C17.5875 19.0388 18.8475 20.0101 20.1019 20.9888C18.7292 22.237 17.0558 23.1073 15.2456 23.5144C13.2476 23.9841 11.1655 23.9616 9.17813 23.4488C7.60632 23.0291 6.13814 22.2893 4.86563 21.2757C3.51886 20.2062 2.41882 18.8587 1.64062 17.3251Z" fill="#319F43"/></g><defs><clipPath id="clip0_4773_1172"><rect width="24" height="24" fill="white"/></clipPath></defs></svg>`,
    signInFunction: signInWithGoogle
}

async function signInWithGoogle() {
    try {
        const googleUser = await GoogleAuth.signIn();

        const { idToken } = googleUser.authentication;

        const response = await authenticateUser(idToken);
        // If user successfully registered
        if (response.success) {
            await registerPushNotificationsIfNeeded();
        }
    } catch (error) {
        console.error('Failed to sign-in User', error);
    }
}

async function authenticateUser(idToken) {
    try {
        const headers = {
            'Content-Type': 'application/json' // Ensure the Content-Type is set
        };

        const response = await fetch(`${BACKEND_URL}auth/google`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ idToken }) // Send the authorization code in the request body
        });

        // Handle the response properly
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json(); // Parse the response as JSON

        if (result) {
            const { token, user } = result; // Extract the JWT token and user details
            // localStorage.setItem('authToken', token);
            await storeAuthToken(token) // Securely store the token

            userProfile.user = user;
            return { success: true };
        } else {
            showPopup(2, "Failed to authenticate user")
            return { success: false };
        }

    } catch (error) {
        console.error('Failed to send authorization code: ', error);
        return { success: false };
    }
}

async function logout() {
    if (Capacitor.isNativePlatform()) { // Native
        try {
            await GoogleAuth.signOut(); // Sign out from Google
            await removeAuthToken();
            userProfile.user = null; // Reset user profile
            console.log("Successfully logged out from native platform.");
        } catch (error) {
            console.error("Failed to sign out from Google:", error);
        }
    } else { // Web
        await removeAuthToken();
        userProfile.user = null; // Reset user profile
        console.log("Successfully logged out from web platform.");
    }
}

const aboutUsPage = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <g clip-path="url(#clip0_1_1136)">
                        <path
                            d="M12 7.5C11.5858 7.5 11.25 7.16422 11.25 6.75C11.25 6.33578 11.5858 6 12 6C12.4142 6 12.75 6.33578 12.75 6.75C12.75 7.16422 12.4142 7.5 12 7.5Z"
                            fill="black" />
                        <path
                            d="M12.75 16.875C12.75 17.0821 12.9179 17.25 13.125 17.25H13.5C13.9142 17.25 14.25 17.5858 14.25 18C14.25 18.4142 13.9142 18.75 13.5 18.75H13.125C12.0895 18.75 11.25 17.9105 11.25 16.875V10.125C11.25 9.91789 11.0821 9.75 10.875 9.75H10.5C10.0858 9.75 9.75 9.41422 9.75 9C9.75 8.58578 10.0858 8.25 10.5 8.25H10.875C11.9105 8.25 12.75 9.08948 12.75 10.125V16.875Z"
                            fill="black" />
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M23.25 12C23.25 5.78681 18.2132 0.75 12 0.75C5.78681 0.75 0.75 5.78681 0.75 12C0.75 18.2132 5.78681 23.25 12 23.25C18.2132 23.25 23.25 18.2132 23.25 12ZM12 7.5C11.5858 7.5 11.25 7.16423 11.25 6.75C11.25 6.33578 11.5858 6 12 6C12.4142 6 12.75 6.33578 12.75 6.75C12.75 7.16423 12.4142 7.5 12 7.5ZM12.75 16.875C12.75 17.0821 12.9179 17.25 13.125 17.25H13.5C13.9142 17.25 14.25 17.5858 14.25 18C14.25 18.4142 13.9142 18.75 13.5 18.75H13.125C12.0895 18.75 11.25 17.9105 11.25 16.875V10.125C11.25 9.91789 11.0821 9.75 10.875 9.75H10.5C10.0858 9.75 9.75 9.41423 9.75 9C9.75 8.58578 10.0858 8.25 10.5 8.25H10.875C11.9105 8.25 12.75 9.08948 12.75 10.125V16.875Z"
                            fill="#62FEBD" />
                    </g>
                    <defs>
                        <clipPath id="clip0_1_1136">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </svg>`,
    title: "About Us",
    path: "about"
}

const contactUsPage = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M6.75233 3C3.8496 3 1.26647 5.09044 0.961474 8.05043C0.678612 10.7955 0.679714 13.1891 0.963563 15.9433C1.26881 18.9051 3.85219 21 6.75814 21H17.2363C20.1249 21 22.7008 18.9291 23.0212 15.9846C23.3251 13.1904 23.3262 10.775 23.0247 8.00531C22.7046 5.06381 20.1288 3 17.2453 3H6.75233Z"
                        fill="#62FEBD" />
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M1.97239 7.13044C2.17651 6.76999 2.63416 6.64328 2.99459 6.84739L9.72391 10.6583C11.1171 11.4473 12.8829 11.4473 14.2761 10.6583L21.0054 6.84739C21.3659 6.64328 21.8235 6.76999 22.0276 7.13044C22.2317 7.49085 22.105 7.9485 21.7446 8.15262L15.0153 11.9635C13.1635 13.0122 10.8365 13.0122 8.98475 11.9635L2.25542 8.15262C1.895 7.9485 1.76828 7.49085 1.97239 7.13044Z"
                        fill="black" />
                </svg>`,
    title: "Contact Us",
    path: "contact-us"
}

const reportBugsPage = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <g clip-path="url(#clip0_1_1150)">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M15.9083 1.75623C16.4611 0.650655 18.0388 0.650655 18.5916 1.75623L23.0031 10.5792C23.5018 11.5765 22.7765 12.75 21.6614 12.75H12.8385C11.7234 12.75 10.9982 11.5765 11.4968 10.5792L15.9083 1.75623ZM17.9999 5.25C17.9999 4.83577 17.6642 4.5 17.2499 4.5C16.8358 4.5 16.4999 4.83577 16.4999 5.25V7.5C16.4999 7.91422 16.8358 8.25 17.2499 8.25C17.6642 8.25 17.9999 7.91422 17.9999 7.5V5.25ZM17.2499 8.625C17.6642 8.625 17.9999 8.96077 17.9999 9.375V9.75C17.9999 10.1642 17.6642 10.5 17.2499 10.5C16.8358 10.5 16.4999 10.1642 16.4999 9.75V9.375C16.4999 8.96077 16.8358 8.625 17.2499 8.625Z"
                            fill="#62FEBD" />
                        <path
                            d="M18 5.25C18 4.83578 17.6642 4.5 17.25 4.5C16.8358 4.5 16.5 4.83578 16.5 5.25V7.5C16.5 7.91423 16.8358 8.25 17.25 8.25C17.6642 8.25 18 7.91423 18 7.5V5.25Z"
                            fill="black" />
                        <path
                            d="M17.25 8.625C17.6642 8.625 18 8.96078 18 9.375V9.75C18 10.1642 17.6642 10.5 17.25 10.5C16.8358 10.5 16.5 10.1642 16.5 9.75V9.375C16.5 8.96078 16.8358 8.625 17.25 8.625Z"
                            fill="black" />
                        <path
                            d="M0.75 3.75C0.75 2.09314 2.09314 0.75 3.75 0.75H6.75C7.16423 0.75 7.5 1.08579 7.5 1.5C7.5 1.91421 7.16423 2.25 6.75 2.25H3.75C2.92157 2.25 2.25 2.92157 2.25 3.75V6.75C2.25 7.16423 1.91421 7.5 1.5 7.5C1.08579 7.5 0.75 7.16423 0.75 6.75V3.75Z"
                            fill="black" />
                        <path
                            d="M1.5 16.5C1.91421 16.5 2.25 16.8358 2.25 17.25V20.25C2.25 21.0784 2.92157 21.75 3.75 21.75H6.75C7.16423 21.75 7.5 22.0858 7.5 22.5C7.5 22.9142 7.16423 23.25 6.75 23.25H3.75C2.09314 23.25 0.75 21.9069 0.75 20.25V17.25C0.75 16.8358 1.08579 16.5 1.5 16.5Z"
                            fill="black" />
                        <path
                            d="M23.25 17.25C23.25 16.8358 22.9142 16.5 22.5 16.5C22.0858 16.5 21.75 16.8358 21.75 17.25V20.25C21.75 21.0784 21.0784 21.75 20.25 21.75H17.25C16.8358 21.75 16.5 22.0858 16.5 22.5C16.5 22.9142 16.8358 23.25 17.25 23.25H20.25C21.9069 23.25 23.25 21.9069 23.25 20.25V17.25Z"
                            fill="black" />
                        <path
                            d="M13.0526 4.95221C12.7091 4.90136 12.3576 4.875 12 4.875C8.06498 4.875 4.875 8.06498 4.875 12C4.875 15.935 8.06498 19.125 12 19.125C15.2861 19.125 18.0527 16.9004 18.8757 13.875H17.3049C16.5327 16.0597 14.4492 17.625 12 17.625C9.48941 17.625 7.36298 15.9802 6.63945 13.7094C7.93658 13.2574 9.00266 12.4131 9.73826 11.349C9.9081 11.4972 10.0834 11.6384 10.2637 11.7721C10.1512 11.227 10.2108 10.6357 10.4907 10.0761L10.5148 10.0278C9.78529 9.33701 9.19275 8.47845 8.80268 7.48076C8.7915 7.45211 8.77871 7.42451 8.76454 7.39808C9.67961 6.75353 10.7956 6.375 12 6.375C12.1129 6.375 12.225 6.37834 12.3363 6.3849L13.0526 4.95221Z"
                            fill="black" />
                    </g>
                    <defs>
                        <clipPath id="clip0_1_1150">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </svg>`,
    title: "Report Bugs",
    path: 'report-bugs',
}

const termsandconditionsPage = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M8.625 0.75C5.31128 0.75 2.625 3.43629 2.625 6.75V17.25C2.625 20.5637 5.31128 23.25 8.625 23.25H15.375C18.6887 23.25 21.375 20.5637 21.375 17.25V7.72774C21.375 6.89621 21.0299 6.10196 20.4219 5.53459L16.1601 1.55683C15.6046 1.03836 14.873 0.75 14.1131 0.75H8.625Z"
                        fill="#62FEBD" />
                    <path
                        d="M15.5117 0.951723C15.2934 0.747952 14.975 0.693131 14.7011 0.812156C14.4272 0.931181 14.25 1.20137 14.25 1.50001V4.5C14.25 6.15686 15.5931 7.5 17.25 7.5H20.625C20.9331 7.5 21.2098 7.31164 21.3228 7.02506C21.4357 6.73845 21.362 6.4119 21.1367 6.20171L15.5117 0.951723Z"
                        fill="black" />
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M6.375 10.5C6.375 10.0858 6.71078 9.75 7.125 9.75H16.875C17.2892 9.75 17.625 10.0858 17.625 10.5C17.625 10.9142 17.2892 11.25 16.875 11.25H7.125C6.71078 11.25 6.375 10.9142 6.375 10.5ZM6.375 15C6.375 14.5858 6.71078 14.25 7.125 14.25H11.9005C12.3147 14.25 12.6505 14.5858 12.6505 15C12.6505 15.4142 12.3147 15.75 11.9005 15.75H7.125C6.71078 15.75 6.375 15.4142 6.375 15Z"
                        fill="black" />
                </svg>`,
    title: "Terms & Conditions",
    path: 'terms-&-conditions'
}

const privacyPolicyPage = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M12.3511 2.06367C12.1247 1.97878 11.8753 1.97878 11.6489 2.06367L3.64888 5.06367C3.25857 5.21003 3 5.58316 3 6V12.0557C3 15.4647 4.92602 18.581 7.97508 20.1056L11.5528 21.8944C11.8343 22.0352 12.1657 22.0352 12.4472 21.8944L16.0249 20.1056C19.074 18.581 21 15.4647 21 12.0557V6C21 5.58316 20.7414 5.21003 20.3511 5.06367L12.3511 2.06367Z"
                        fill="#62FEBD" />
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M15.6248 9.21914C16.0561 9.56415 16.126 10.1934 15.781 10.6247L11.781 15.6247C11.5856 15.8689 11.2873 16.0076 10.9748 15.9997C10.6622 15.9918 10.3713 15.8381 10.1886 15.5843L8.18854 12.8065C7.86584 12.3583 7.96757 11.7334 8.41577 11.4107C8.86397 11.088 9.48891 11.1897 9.81161 11.6379L11.042 13.3468L14.2192 9.37531C14.5643 8.94405 15.1935 8.87413 15.6248 9.21914Z"
                        fill="black" />
                </svg>`,
    title: "Privacy Policy",
    path: "privacy-policy"
}

const disclaimerPage = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <g clip-path="url(#clip0_1_1180)">
                        <path
                            d="M7.875 9.9375C7.875 7.76288 9.63788 6 11.8125 6H12.0938C14.3202 6 16.125 7.80484 16.125 10.0312C16.125 12.0483 14.6436 13.7193 12.7095 14.0158V15.75C12.7095 16.1642 12.3737 16.5 11.9595 16.5C11.5452 16.5 11.2095 16.1642 11.2095 15.75V13.3125C11.2095 12.8983 11.5452 12.5625 11.9595 12.5625H12.0938C13.4917 12.5625 14.625 11.4292 14.625 10.0312C14.625 8.63329 13.4917 7.5 12.0938 7.5H11.8125C10.4663 7.5 9.375 8.59129 9.375 9.9375C9.375 10.3517 9.03922 10.6875 8.625 10.6875C8.21078 10.6875 7.875 10.3517 7.875 9.9375Z"
                            fill="black" />
                        <path
                            d="M11.25 17.625C11.25 18.0392 11.5858 18.375 12 18.375C12.4142 18.375 12.75 18.0392 12.75 17.625C12.75 17.2108 12.4142 16.875 12 16.875C11.5858 16.875 11.25 17.2108 11.25 17.625Z"
                            fill="black" />
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M23.25 12C23.25 5.78681 18.2132 0.75 12 0.75C5.78681 0.75 0.75 5.78681 0.75 12C0.75 18.2132 5.78681 23.25 12 23.25C18.2132 23.25 23.25 18.2132 23.25 12ZM7.875 9.9375C7.875 7.76288 9.63787 6 11.8125 6H12.0938C14.3202 6 16.125 7.80484 16.125 10.0312C16.125 12.0483 14.6436 13.7193 12.7095 14.0158V15.75C12.7095 16.1642 12.3737 16.5 11.9595 16.5C11.5452 16.5 11.2095 16.1642 11.2095 15.75V13.3125C11.2095 12.8983 11.5452 12.5625 11.9595 12.5625H12.0938C13.4917 12.5625 14.625 11.4292 14.625 10.0312C14.625 8.63329 13.4917 7.5 12.0938 7.5H11.8125C10.4663 7.5 9.375 8.59129 9.375 9.9375C9.375 10.3517 9.03922 10.6875 8.625 10.6875C8.21077 10.6875 7.875 10.3517 7.875 9.9375ZM11.25 17.625C11.25 18.0392 11.5858 18.375 12 18.375C12.4142 18.375 12.75 18.0392 12.75 17.625C12.75 17.2108 12.4142 16.875 12 16.875C11.5858 16.875 11.25 17.2108 11.25 17.625Z"
                            fill="#62FEBD" />
                    </g>
                    <defs>
                        <clipPath id="clip0_1_1180">
                            <rect width="24" height="24" fill="white" />
                        </clipPath>
                    </defs>
                </svg>`,
    title: 'Disclaimer',
    path: 'disclaimer',
}

const bookmarksPage = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 11.098V16.091C3 19.187 3 20.736 3.734 21.412C4.084 21.735 4.526 21.938 4.997 21.992C5.984 22.105 7.137 21.085 9.442 19.046C10.462 18.145 10.971 17.694 11.56 17.576C11.85 17.516 12.15 17.516 12.44 17.576C13.03 17.694 13.539 18.145 14.558 19.046C16.863 21.085 18.016 22.105 19.003 21.991C19.473 21.938 19.916 21.735 20.266 21.412C21 20.736 21 19.188 21 16.091V11.097C21 6.809 21 4.665 19.682 3.332C18.364 2 16.242 2 12 2C7.757 2 5.636 2 4.318 3.332C3.511 4.148 3.198 5.27 3.077 7M15 6H9Z" fill="#62FEBD"/>
            <path d="M3 11.098V16.091C3 19.187 3 20.736 3.734 21.412C4.084 21.735 4.526 21.938 4.997 21.992C5.984 22.105 7.137 21.085 9.442 19.046C10.462 18.145 10.971 17.694 11.56 17.576C11.85 17.516 12.15 17.516 12.44 17.576C13.03 17.694 13.539 18.145 14.558 19.046C16.863 21.085 18.016 22.105 19.003 21.991C19.473 21.938 19.916 21.735 20.266 21.412C21 20.736 21 19.188 21 16.091V11.097C21 6.809 21 4.665 19.682 3.332C18.364 2 16.242 2 12 2C7.757 2 5.636 2 4.318 3.332C3.511 4.148 3.198 5.27 3.077 7M15 6H9" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
            </svg>`,
    title: 'Bookmarks',
    path: 'bookmarks',
}
</script>

<template>
    <div id="container">
        <div class="header">
            <div class="left">
                <div @click="router.push({ name: 'home' })" class="back-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.4159 2.20499 11.205L8.20499 5.205C8.41825 5.00628 8.70032 4.89809 8.99177 4.90324C9.28322 4.90838 9.5613 5.02645 9.76742 5.23257C9.97354 5.43869 10.0916 5.71676 10.0967 6.00821C10.1019 6.29967 9.99371 6.58174 9.79499 6.795L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z"
                            fill="black" />
                    </svg>
                </div>
            </div>
            <div class="middle">
                <h1 class="title">Settings</h1>
            </div>
        </div>
        <div class="signincontainer">
            <PWA></PWA>
            <!-- <SignInUsingGoogle></SignInUsingGoogle> -->
            <div class="text-xl text-center" style="color: black" v-if="!userProfile.user">
                Dont have an account yet?
                <br>
                Try signing up here!
            </div>
            <SignInUsing :platform="googlePlatform" v-if="!userProfile.user"></SignInUsing>
            <div class="userInfo" v-else>
                <img :src="userProfile.user.picture" class="profileImage" alt="Profile Picture" height="48" width="48">
                <div class="text">
                    <p class="fullname">{{ userProfile.user.given_name }} {{ userProfile.user.family_name }}</p>
                    <p class="email">{{ userProfile.user.email }}</p>
                </div>
                <div class="logout"><button @click="logout">Log Out</button></div>
            </div>
        </div>
        <div class="account-info">
            <div v-if="userProfile.user" class="user-account-info">
                <p class="headline">ACCOUNT</p>
                <AccountPageItem :page="bookmarksPage"></AccountPageItem>
            </div>
            <div class="text-md text-center -mb-2">Want to stay connected?<br>Check out our social media pages below!
            </div>
            <div class="social-icons">
                <a :href="INSTAGRAM.link" target="_blank" rel="noopener noreferrer">
                    <div v-html="INSTAGRAM.svg"></div>
                </a>
                <a :href="LINKEDIN.link" target="_blank" rel="noopener noreferrer">
                    <div v-html="LINKEDIN.svg"></div>
                </a>
                <a :href="X.link" target="_blank" rel="noopener noreferrer">
                    <div v-html="X.svg"></div>
                </a>
            </div>
            <p class="headline">GENERAL</p>
            <AccountPageItem :page="aboutUsPage"></AccountPageItem>
            <AccountPageItem :page="contactUsPage"></AccountPageItem>
            <AccountPageItem :page="reportBugsPage"></AccountPageItem>
            <p class="headline">LEGAL</p>
            <AccountPageItem :page="termsandconditionsPage"></AccountPageItem>
            <AccountPageItem :page="privacyPolicyPage"></AccountPageItem>
            <AccountPageItem :page="disclaimerPage"></AccountPageItem>
        </div>
    </div>
</template>

<style scoped>
#container {
    height: calc(100%) !important;
    width: 100%;
    box-sizing: border-box;
    background-color: transparent;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    color: black;
    padding: 20px;
}

.header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
}

.middle {
    text-align: center;
    position: absolute;
    right: 50%;
    transform: translate(50%, 0);
}

.title {
    font-size: 20px;
    font-weight: bold;
}

.back-arrow {
    background-color: #EBEFEE;
    width: fit-content;
    height: fit-content;
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
}

.top-row {
    >i {
        font-size: 36px !important;
    }

    width: fit-content;
    color: var(--main-color);
    padding: 15px;
}

.account-info {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    overflow: auto;
    height: 100%;
    padding: 4% 0;
}

.list-item {
    display: flex;
    flex-direction: row;
    gap: 10px;
    text-decoration: none;
    color: white;
}

.account-info i {
    font-size: 40px;
    padding: 0 5px 0 20px;
    display: flex;
    align-items: center;
}

.headline {
    font-size: 16px;
    display: flex;
    align-items: center;
    color: #828282;
}

.userInfo {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    /* flex-wrap: wrap; */
    background-color: var(--main-color);
    border-radius: var(--border-radius);
    padding: 10px;
    gap: 5%;
}

.text {
    display: flex;
    flex-direction: column;
    justify-content: start;
}

.signincontainer {
    margin: 6% 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.logout {
    color: #ff0000;
    text-align: center;
    padding: 0 10px;
    flex: 1;
    display: flex;
    flex-direction: row-reverse;
}

.user-account-info {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100%;
}

.social-icons {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
}
</style>

<style>
.profileImage {
    border: 3px solid black;
    border-radius: var(--border-radius);
    height: 36px;
    width: 36px;
}
</style>