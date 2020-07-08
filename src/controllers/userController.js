const User = require('../models/userModel')
const route = require('express').Router()


route.post('/register', async (req, res) => {
    const { city, address, zip_code, name, sur_name, phone, email, password, role } = req.body

    try {
        const userInfo = { name, sur_name, phone, email, password, role }
        const addressInfo = { city, address, zip_code }


        const user = new User(userInfo, addressInfo)

        const result = await user.insert()

        if (result.Error) return res.status(400).send(result)


        const { id, sessionToken } = result

        return res.status(200).send({
            id,
            name,
            sur_name,
            email,
            phone,
            sessionToken
        })

    } catch (error) {

        console.log(error)
        res.status(400).send({ Error: 'Registration failed!' })

    }
})

route.get('/login', async (req, res) => {
    const [, hash] = req.headers.authorization.split(' ')
    const [email, password] = Buffer.from(hash, 'base64')
        .toString()
        .split(':')

    try {

        const result = await User.login(email, password)

        if (result.Error) return res.status(403).send(result)


        return res.status(200).send({ Success: 'Login authorized!', sessionToken: result })

    } catch (error) {

        console.log(error)
        res.status(400).send({ Error: 'Login failed!' })

    }
})

route.get('/forgot-password', async (req, res) => {
    const { email } = req.body

    try {

        const result = await User.forgotPassword(email)

        if (result.Error) return res.status(400).send(result)

        return res.status(200).send({ Success: 'Email sended!', ResetPasswordToken: result })

    } catch (error) {

        console.log(error)
        res.status(400).send({ Error: 'Failed on sending email!' })

    }

})

route.patch('/reset-password', async (req, res) => {
    const { token, password } = req.body

    try {

        const result = await User.resetPassword(token, password)

        if (result.Error) return res.status(400).send(result)

        return res.status(200).send({ Success: 'Password changed!', ...result })

    } catch (error) {

        console.log(error)
        res.status(400).send({ Error: 'Change password failed!' })

    }
})


module.exports = app => app.use('/', route)