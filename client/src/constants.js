//https://joshuapleduc.medium.com/use-constants-to-set-backend-url-for-both-production-and-development-904ca269d48f
const prod = {
    url: {
        // BACKEND_URL: 'https://sumnews-47050b3e4ef6.herokuapp.com/', old backend
        BACKEND_URL: 'http://localhost:3000/', // new backend
        FRONTEND_URL: 'http://localhost:5173/'
    },
};

const dev = {
    url: {
        // BACKEND_URL: 'http://localhost:3000/',
        // FRONTEND_URL: 'http://localhost:5173/',
    },
};

export const config = prod; 