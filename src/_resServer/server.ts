import app from './app'

const port = process.env.RESOURCE_PORT || 3333
app.listen(port, () => console.log(`Server running at port: ${ port }`))