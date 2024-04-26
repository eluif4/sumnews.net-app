const kleur = require('kleur')

function handleError(error, customError) {
    console.log(kleur.red(customError))
    if (error.response) {
        // The request was made, but the server responded with a status code that falls out of the range of 2xx
        console.error('Request failed with status code:', error.response.status);
        console.error('Response data:', error.response.data);
    } else if (error.request) {
        // The request was made, but no response was received
        console.error('No response received from the server');
    } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error:', error.message);
    }
}

// function runWithTimeout(func, timeout) {
//     return new Promise((resolve, reject) => {
//         const timer = setTimeout(() => {
//             reject(new Error('Function times out'))
//         }, timeout)

//         func()
//             .then((result) => {
//                 clearTimeout(timer)
//                 resolve(result)
//             })
//             .catch((error) => {
//                 clearTimeout(timer)
//                 reject(error)
//             })
//     })
// }

module.exports = {
    handleError,
    // runWithTimeout
}