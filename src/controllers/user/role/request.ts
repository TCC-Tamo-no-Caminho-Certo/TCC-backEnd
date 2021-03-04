import ValSchema, { P } from '../../../utils/validation'
import University from '../../../utils/university'
import ArisError from '../../../utils/arisError'
import File from '../../../utils/minio'
import User from '../../../utils/user'

import { auth, permission } from '../../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.post('/request/professor', auth, permission(['!professor']), async (req: Request, res: Response) => {
  const { _user_id: user_id, inst_email, doc, university_id, campus_id, course_id, full_time, postgraduate, lattes } = req.body

  try {
    new ValSchema({
      inst_email: P.joi.bool(),
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required(),
      full_time: P.joi.bool().required(),
      postgraduate: P.joi.bool().required(),
      lattes: P.joi.string().allow(null)
    }).validate({ inst_email, university_id, campus_id, course_id, full_time, postgraduate, lattes })

    if (inst_email) {
      const [university] = await University.find({ university_id })
      if (!university) throw new ArisError('University not found!', 400)

      const regex = new RegExp(university.get('professor_regex'))
      const emails = await User.Email.find({ user_id })

      if (!emails.some(email => regex.test(email.get('address')))) throw new ArisError('User don`t have an institutional email!', 400)

      await User.Role.Request.create(user_id, 'professor', { campus_id, course_id, full_time, postgraduate, lattes })
    } else if (doc) {
      const file = new File(doc)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      const doc_uuid = await file.insert('documents', 'application/pdf')

      await User.Role.Request.create(user_id, 'professor', { campus_id, course_id, full_time, postgraduate, lattes }, doc_uuid)
    } else throw new ArisError('None of the flow data was provided (doc | inst_email)', 400)

    return res.status(200).send({ success: true, message: 'Role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Role request')
    return res.status(result.status).send(result.send)
  }
})

Router.post('/request/student', auth, permission(['!student']), async (req: Request, res: Response) => {
  const { _user_id: user_id, inst_email, doc, university_id, campus_id, course_id, ar, semester } = req.body

  try {
    new ValSchema({
      inst_email: P.joi.bool(),
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required(),
      ar: P.joi.number().required(),
      semester: P.joi.number().min(1).max(10).required()
    }).validate({ inst_email, university_id, campus_id, course_id, ar, semester })

    if (inst_email) {
      const [university] = await University.find({ university_id })
      if (!university) throw new ArisError('University not found!', 400)

      const regex = new RegExp(university.get('student_regex'))
      const emails = await User.Email.find({ user_id })

      if (!emails.some(email => regex.test(email.get('address')))) throw new ArisError('User don`t have an institutional email!', 400)

      await User.Role.Request.create(user_id, 'student', { campus_id, course_id, ar, semester })
    } else if (doc) {
      const file = new File(doc)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      const doc_uuid = await file.insert('documents', 'application/pdf')

      await User.Role.Request.create(user_id, 'student', { campus_id, course_id, ar, semester }, doc_uuid)
    } else throw new ArisError('None of the flow data was provided (doc or inst_email)', 400)

    return res.status(200).send({ success: true, message: 'Role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Role request')
    return res.status(result.status).send(result.send)
  }
})

Router.post('/request/moderator', auth, permission(['professor']), async (req: Request, res: Response) => {
  const { _user_id: user_id } = req.body

  try {
    await User.Role.Request.create(user_id, 'moderator')

    return res.status(200).send({ success: true, message: 'Role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Role request')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/accept/:id', auth, permission(['moderator']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await User.Role.Request.find({ request_id })
    if (!request) throw new ArisError('Request not found!', 400)

    const roles = (await User.Role.find({ user_id: request.get('user_id') })).map(role => role.get('title'))
    const new_roles = await request.accept(roles)

    await User.updateAccessTokenData(request.get('user_id'), new_roles)

    return res.status(200).send({ success: true, message: 'Accept complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Accept')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/reject/:id', auth, permission(['moderator']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)
  const { feedback } = req.body

  try {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await User.Role.Request.find({ request_id })
    if (!request) throw new ArisError('Request not found!', 400)

    await request.reject(feedback)

    return res.status(200).send({ success: true, message: 'Reject complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Reject')
    return res.status(result.status).send(result.send)
  }
})

Router.delete('/request/:id', auth, permission(['moderator']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await User.Role.Request.find({ request_id })
    if (!request) throw new ArisError('Request not found!', 400)
    await request.delete()

    return res.status(200).send({ success: true, message: 'Delete complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default Router
