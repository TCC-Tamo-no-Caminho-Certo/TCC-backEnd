const db = require('../../src/database')
const request = require('supertest')
const app = require('../../src/app')
const jwt = require('jsonwebtoken')


describe('Authentication', () => {

    afterAll(async () => {
        const ids = await db('user').select('id_user').whereIn('email', ["test@hotmail.com", "test2@hotmail.com"]).then(row => row.map(user => user.id_user))
        await db('role').del().whereIn('user_id', ids)
        await db('user').del().whereIn('id_user', ids)
        await db('address').del().where({ address: 'test', zip_code: 'test' })
    })



    test('Should receive JWT when created a user with valid credentials', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                city: "São Paulo",
                address: "test",
                zip_code: "test",
                name: "Test",
                sur_name: "test",
                phone: "test",
                email: "test@hotmail.com",
                password: "test",
                role: "professor"
            })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("sessionToken")
    })

    test('Should created a user with an existing address', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                city: "São Paulo",
                address: "test",
                zip_code: "test",
                name: "Test2",
                sur_name: "test2",
                phone: "test2",
                email: "test2@hotmail.com",
                password: "test2",
                role: "customer"
            })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("sessionToken")
    })

    test('Shouldn´t create a user with invalid credentials', async () => {
        const response = await request(app)
            .post('/register')
            .send({
                city: "São Paulo",
                address: "test",
                zip_code: "test",
                name: "Test",
                sur_name: "test",
                phone: "test",
                email: "test@hotmail.com",
                password: "test",
                role: "professor"
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("Error")
    })



    test('Shouldn´t login with invalid password', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: "test@hotmail.com",
                password: "wrongPassword"
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("Error")
    })

    test('Shouldn´t login with invalid email', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: "wrong email",
                password: "test"
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("Error")
    })

    test('Should receive JWT when login with valid credentials', async () => {
        const response = await request(app)
            .post('/login')
            .send({
                email: "test@hotmail.com",
                password: "test"
            })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("sessionToken")
    })



    test('Shouldn´t receive JWT with invalid email', async () => {
        const response = await request(app)
            .post('/forgot-password')
            .send({
                email: "wrong email"
            })

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty("Error")
    })

    test('Shouldn´t change password with invalid token', async () => {

        const response = await request(app)
            .post('/reset-password')
            .send({
                token: 'wrong token',
                password: "test2"
            })

        expect(response.status).toBe(400)
        expect(response.body.Error).toBe('Invalid token signature!')
    })

    test('Shouldn´t change password with expired token', async () => {

        const id = await db('user').select('id_user').where({ email: "test@hotmail.com" }).then(row => row[0].id_user)
        const token = jwt.sign({ id }, process.env.JWT_RESET_SECRET, { expiresIn: '10ms' })

        setTimeout(() => { }, 1000)

        const response = await request(app)
            .post('/reset-password')
            .send({
                token,
                password: "test2"
            })

        expect(response.status).toBe(400)
        expect(response.body.Error).toBe('Token expired!')
    })

    test('Should change password with valid credentials', async () => {
        const response1 = await request(app)
            .post('/forgot-password')
            .send({
                email: "test@hotmail.com"
            })

        expect(response1.status).toBe(200)
        expect(response1.body).toHaveProperty("ResetPasswordToken")

        const response2 = await request(app)
            .post('/reset-password')
            .send({
                token: response1.body.ResetPasswordToken,
                password: "test2"
            })

        expect(response2.status).toBe(200)
    })

})