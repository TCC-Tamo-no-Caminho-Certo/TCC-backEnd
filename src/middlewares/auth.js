const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {

    const auth = req.headers.authorization

    if (!auth) return res.status(401).json({ Error: 'No token provided!' })

    const parts = auth.split(' ')

    if (parts.length !== 2) return res.status(401).json({ Error: 'Token error!' })

    const [bearer, token] = parts

    if (!/^Bearer$/i.test(bearer)) return res.status(401).json({ Error: 'Token malformated!' })

    jwt.verify(token, process.env.JWT_PUBLIC_KEY, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) return res.status(401).json({ Error: 'Invalid token!' })

        req.userID = decoded.id
        req.role = decoded.role
        next()
    })

}