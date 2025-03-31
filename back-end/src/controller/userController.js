const { getUserService } = require ("../services/userService")

const GetAllUser = async (req, res) => {
    const dataUser = await getUserService()
    return res.status(200).json(dataUser)
}

module.exports = {GetAllUser}