import express, { Request, Response, Application } from 'express'
import User from '../../models/userModel'
import Data from '../../models/dataModel'
const route = express.Router()


route.post('/register', async (req: Request, res: Response) => {
    const { city, address, zip_code, name, sur_name, phone, email, password, role } = req.body

    try {

        const user_info = { name, sur_name, phone, email, password, role }
        const address_info = { city, address, zip_code }


        Data.validate(user_info, 'user_register')
        Data.validate(address_info, 'address')

        const user = new User(user_info, address_info)

        const result = await user.insert()

        if (result.Error) return res.status(400).send({ Success: false, Message: 'Registration unauthorized!', Error: result })


        const { id, access_token } = result

        return res.status(200).send({
            Success: true,
            Message: 'Registration complete!',
            id,
            name,
            sur_name,
            email,
            phone,
            access_token
        })

    } catch (error) {

        if (error.isJoi) {

            const error_list: any = {}
            error.details.forEach((error_element: any) => {
                error_list.path = error_element.message
            })
            res.status(400).send({ Success: false, Message: 'Login unauthorized!', Error: error_list })

        } else {

            console.log(error)
            res.status(500).send({ Success: false, Message: 'Registration failed!' })

        }

    }
})

route.get('/login', async (req: Request, res: Response) => {
    const basic = req.headers.authorization
    if (!basic) return res.status(403).send({ Success: false, Message: 'Basic auth not provided!' })

    const [, hash] = basic.split(' ')
    const [email, password] = Buffer.from(hash, 'base64')
        .toString()
        .split(':')

    try {

        Data.validate({ email, password }, 'user_login')

        const result = await User.login(email, password)

        if (result.Error) return res.status(403).send({ Success: false, Message: 'Login unauthorized!', Error: result })


        return res.status(200).send({ Success: true, Message: 'Login authorized!', ...result })

    } catch (error) {

        if (error.isJoi) {

            const error_list: any = {}
            error.details.forEach((error_element: any) => {
                error_list.path = error_element.message
            })
            res.status(400).send({ Success: false, Message: 'Login unauthorized!', Error: error_list })

        } else {

            console.log(error)
            res.status(500).send({ Success: false, Message: 'Login failed!' })

        }

    }
})

route.get('/forgot-password', async (req: Request, res: Response) => {
    const { email } = req.body

    try {

        Data.validate({ email }, 'email')

        const result = await User.forgotPassword(email)

        if (result.Error) return res.status(403).send(result)

        return res.status(200).send({ Success: true, Message: 'Email sended!', ...result })

    } catch (error) {

        if (error.isJoi) {

            res.status(400).send({ Success: false, Message: 'Unauthorized to change password!', Error: error.details.message })

        } else {

            console.log(error)
            res.status(500).send({ Success: false, Message: 'Failed on sending email!' })

        }

    }

})

route.patch('/reset-password', async (req: Request, res: Response) => {
    const { token, password } = req.body

    try {

        const result = await User.resetPassword(token, password)

        if (result.Error) return res.status(403).send(result)

        return res.status(200).send({ Success: true, Message: 'Password changed!', ...result })

    } catch (error) {

        console.log(error)
        res.status(500).send({ Error: 'Change password failed!' })

    }
})


export default (app: Application) => app.use('/', route)