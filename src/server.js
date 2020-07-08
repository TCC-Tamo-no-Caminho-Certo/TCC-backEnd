const app = require('./app')

const port = 3333
app.listen(process.env.PORT || port, err => err ? console.log({Error: err}) : console.log(`Server running at port: ${ process.env.PORT || port }`))