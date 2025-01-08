import { Capacitor } from '@capacitor/core';
const isAndroid = Capacitor.getPlatform() === 'android';
const isWeb = Capacitor.getPlatform() === 'web';
console.log(`Platform: ${Capacitor.getPlatform()}`);
//https://joshuapleduc.medium.com/use-constants-to-set-backend-url-for-both-production-and-development-904ca269d48f
const prod = {
    url: {
        BACKEND_URL: 'https://sumnewsv3-3d5592632fd4.herokuapp.com/',
        FRONTEND_URL: 'https://app.sumnews.net/'
    },
};

const dev = { 
    url: {
        // BACKEND_URL: 'http://localhost:3000/',
        FRONTEND_URL: 'http://localhost:5173/', // <- This for emulated device
        // BACKEND_URL: 'http://192.168.225.56:3000/',
        // FRONTEND_URL: 'http://192.168.225.56:5173/',
        BACKEND_URL: 'http://10.0.2.2:3000/', // <- This for emulated device
        // FRONTEND_URL: 'http://10.0.2.2:5173/'
    },

    url: {
        BACKEND_URL: isAndroid
            ? 'http://10.0.2.2:3000/' // Android emulator-specific
            : 'http://localhost:3000/', // Default for web or other platforms
        FRONTEND_URL: isWeb
            ? 'http://localhost:5173/' // Web
            : 'http://localhost:5173/' // Android or other platform
    },
};

export const config = prod;