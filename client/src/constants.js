//https://joshuapleduc.medium.com/use-constants-to-set-backend-url-for-both-production-and-development-904ca269d48f
const prod = {
    url: {
        BACKEND_URL: 'https://sumnews-47050b3e4ef6.herokuapp.com/',
        FRONTEND_URL: 'https://sumnews.net/'
    },
};

const dev = {
	url: {
		BACKEND_URL: 'http://localhost:3000/',
        FRONTEND_URL: 'http://localhost:5173/',
		// BASE_URL: 'http://10.0.0.5',
		// BASE_URL: 'http://192.168.1.126',
	},
};

export const config = dev; 