require('dotenv').config()

const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 8888
const hostname = process.env.HOSTNAME
const webRoutes = require('./route/web')

app.use('/', webRoutes)
//config CORS
app.use(cors())


const db = require("./models");

db.sequelize.sync()
    .then(() => {
        console.log("Synced database.");
    })
    .catch((err) => {
        console.log("Failed to sync database: " + err.message);
    });

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});