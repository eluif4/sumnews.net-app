//---LIBRARIES---
const path = require("path");
const cron = require("node-cron")
const kleur = require('kleur')
const dotenv = require('dotenv')

dotenv.config({ path: path.resolve(__dirname, './server/config/config.env') });

const express = require('express');
const cors = require('cors')
const mongodb = require('./server/config/dbconfig')
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:5173", "https://localhost:5173"]
    })
)

app.get('/', (req, res) => {
    res.send('Hello MEVN Stack!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});