const { GetAllUser } = require("../controller/userController");
const express = require("express");
const router = express.Router();

// Middleware để thêm header CORS
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3001"); // Cho phép frontend của bạn
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

router.get("/", (req, res) => {
    return res.status(200).json("Hello world api");
});

router.get("/user", GetAllUser);

module.exports = router;
