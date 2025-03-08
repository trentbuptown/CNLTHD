const {GetAllUser} = require ("../controller/userController")
const express = require('express');
const router = express.Router()

router.get("/", (req, res) => {
    return res.status(200).json("Hello world api")
})

router.get("/user", GetAllUser)

module.exports = router