import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export default (req: Request, res: Response, next: NextFunction) => {

    const auth = req.headers.authorization

    if (!auth) return res.status(401).json({ Success: false, Message: 'No token provided!' })

    const parts = auth.split(' ')

    if (parts.length !== 2) return res.status(401).json({ Success: false, Message: 'Token error!' })

    const [bearer, token] = parts

    if (!/^Bearer$/i.test(bearer)) return res.status(401).json({ Success: false, Message: 'Token malformated!' })

    jwt.verify(token, (<string>process.env.JWT_PUBLIC_KEY), { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) return res.status(401).json({ Success: false, Message: 'Invalid token!' })

        req.body.user_id = (<any>decoded).id
        req.body.role = (<any>decoded).role
        next()
    })

}