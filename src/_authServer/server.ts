import app from './app'

const port = process.env.AUTH_PORT || 3232
app.listen(port, () => console.log(`Auth Server running at port: ${ port }`))