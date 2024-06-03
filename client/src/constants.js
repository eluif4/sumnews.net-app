//https://joshuapleduc.medium.com/use-constants-to-set-backend-url-for-both-production-and-development-904ca269d48f
const prod = {
    url: {
        // BACKEND_URL: 'https://sumnews-47050b3e4ef6.herokuapp.com/', old backend
        BACKEND_URL: 'https://sumnewsv3-3d5592632fd4.herokuapp.com/', // new backend
        FRONTEND_URL: 'https://sumnews.net/'
    },
};

const dev = {
    url: {
        BACKEND_URL: 'http://localhost:3000/',
        FRONTEND_URL: 'http://localhost:5173/',
        // BACKEND_URL: 'http://192.168.1.120:3000/',
        // FRONTEND_URL: 'http://192.168.1.120:5173/',
    },
};

export const config = dev; 