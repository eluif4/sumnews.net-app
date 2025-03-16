import router from '../router'
import { config } from '../constants';
import { userProfile } from '../main';
import { registerPushNotificationsIfNeeded } from '../main';
import { storeAuthToken, removeAuthToken, showPopup } from './utility';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Capacitor } from '@capacitor/core';

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

// Move this function to utility.js
export async function signInWithGoogle() {
    try {
        console.log('Logging in with capgo/social-login plugin');
        const googleUser = await SocialLogin.login({
            provider: 'google',
            options: {
                scopes: ['profile', 'email'],
            }
        });

        const { idToken } = googleUser.result; // Extract the authorization code

        const response = await authenticateUser(idToken);
        // If user successfully registered
        if (response.success) {
            await registerPushNotificationsIfNeeded();
        }
    } catch (error) {
        console.error('Failed to sign-in User', error);
    }
}

// Move this function to utility.js
export async function authenticateUser(idToken) {
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

// Move this function to utility.js
export async function logoutUserFromGoogle() {
    if (Capacitor.isNativePlatform()) { // Native
        try {
            await SocialLogin.logout({ provider: 'google' }); // Sign out from Google
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