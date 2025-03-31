const express = require('express')
const app = express()
const cors = require('cors')
const productRoutes = require('./src/routes/productRoutes')
const port = 5000
const connectDB = require("./src/config/db");
require('dotenv').config()
// Kết nối MongoDB
connectDB();
app.use(cors())
app.use(express.json())

app.use('/api/products', productRoutes)
app.get('/', () => {
    return "abc"
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
