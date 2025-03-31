const db = require('../models/index')


const getUserService = async () => {
    try {
        const users = await db.User.findAll();
        return users;
    }catch (error) {
        console.log(error)
    }

}

module.exports = { getUserService }