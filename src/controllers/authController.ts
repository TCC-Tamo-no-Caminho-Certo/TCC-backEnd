import express, { Request, Response, Application } from 'express'
import ArisError from '../models/arisErrorModel'
import User from '../models/userModel'
import Data from '../models/dataModel'
const route = express.Router()


route.post('/register', async (req: Request, res: Response) => {
    const { city, address, zip_code, name, sur_name, phone, email, password, role } = req.body

    try {

        const user_info = { name, sur_name, phone, email, password, role }
        const address_info = { city, address, zip_code }

        Data.validate(user_info, 'user_register')
        Data.validate(address_info, 'address')

        const user = new User({ ...user_info, ...address_info })

        await user.insert()
        const access_token = user.generateAccessToken()

        return res.status(200).send({
            Success: true,
            Message: 'Registration complete!',
            user,
            access_token
        })

    } catch (error) {

        const result = ArisError.errorHandler(error, 'Registration unauthorized!')

        if (!result) {
            console.log(error)
            return res.status(500).send({ Success: false, Message: 'Registration failed!' })
        }
        return res.status(result.status).send(result.send)

    }
})

route.get('/login', async (req: Request, res: Response) => {
    const basic = req.headers.authorization
    if (!basic) throw new ArisError('Basic auth not provided!', 400)

    const [, hash] = basic.split(' ')
    const [email, password] = Buffer.from(hash, 'base64').toString().split(':')

    try {

        Data.validate({ email, password }, 'user_login')

        const user = await User.getUser(email)
        const access_token = await user.login(password)

        return res.status(200).send({ Success: true, Message: 'Login authorized!', access_token })

    } catch (error) {

        const result = ArisError.errorHandler(error, 'Login unauthorized!')

        if (!result) {
            console.log(error)
            return res.status(500).send({ Success: false, Message: 'Login failed!' })
        }
        return res.status(result.status).send(result.send)

    }
})

route.get('/forgot-password', async (req: Request, res: Response) => {
    const email = req.query.email

    try {

        Data.validate({ email }, 'forgot_password')

        const ResetPasswordToken = await User.forgotPassword(<string>email)

        return res.status(200).send({ Success: true, Message: 'Email sended!', ResetPasswordToken })

    } catch (error) {

        const result = ArisError.errorHandler(error, 'Unauthorized to change password!')

        if (!result) {
            console.log(error)
            return res.status(500).send({ Success: false, Message: 'Failed on sending reset password email!' })
        }
        return res.status(result.status).send(result.send)

    }

})

route.patch('/reset-password', async (req: Request, res: Response) => {
    const { token, password } = req.body

    try {

        const result = await User.resetPassword(token, password)

        return res.status(200).send({ Success: true, Message: 'Password changed!', ...result })

    } catch (error) {

        const result = ArisError.errorHandler(error, 'Unauthorized to change password!')

        if (!result) {
            console.log(error)
            return res.status(500).send({ Success: false, Message: 'Change password failed!' })
        }
        return res.status(result.status).send(result.send)

    }
})


export default (app: Application) => app.use('/', route)