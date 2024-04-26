const mongoose = require("mongoose");
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })

//--------------------- CONNECTION TO DB ---------------------
const mongoURI = process.env.MONGODB_URI + process.env.MONGODB_DATABASE
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.once('open', () => console.info("Connected to MongoDB"));
db.on('error', console.error.bind(console, 'connection error:'))

module.exports = mongoose;