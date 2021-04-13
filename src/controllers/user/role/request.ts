import ValSchema, { P } from '../../../utils/validation'
import University from '../../../utils/university'
import ArisError from '../../../utils/arisError'
import Mail from '../../../services/nodemailer'
import File from '../../../utils/minio'
import User from '../../../utils/user'

import { auth, permission } from '../../../middlewares'

import express, { Request, Response } from 'express'
const Router = express.Router()

Router.get('/request', auth, async (req: Request, res: Response) => {
  const { _user_id: user_id } = req.body

  try {
    const requests = await User.Role.Request.find({ user_id })

    return res.status(200).send({ success: true, message: 'Fecth complete!', requests })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fecth')
    return res.status(result.status).send(result.send)
  }
})

Router.post('/request/moderator', auth, permission(['professor', '!moderator']), async (req: Request, res: Response) => {
  const { _user_id: user_id, _roles: user_roles, university_id, pretext } = req.body

  try {
    new ValSchema({ university_id: P.joi.number().positive().required(), pretext: P.joi.string().empty().allow(null) }).validate({ university_id, pretext })

    const requests = await User.Role.Request.find({ user_id, role_id: User.Role.Manage.find('moderator').get('role_id') })
    if (requests.some(request => request.get('data')!.university_id === university_id)) throw new ArisError('Request already made!', 403)

    const [professor_course] = await User.Role.Professor.Course.find({ user_id, university_id })

    if (professor_course.get('full_time')) {
      await User.Role.Moderator.add({ user_id, university_id })

      if (!user_roles.some((role: string) => role === 'moderator')) {
        user_roles.push('moderator')
        await User.Role.add(user_id, 'moderator')
        await User.updateAccessTokenData(user_id, user_roles)
      }
    } else {
      if (!pretext) throw new ArisError('Professor that isn´t full time needs to provide a pretext!', 403)
      await User.Role.Request.create(user_id, 'moderator', { university_id, pretext })
    }

    return res.status(200).send({ success: true, message: 'Role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Role request')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/moderator/:id', auth, async (req: Request, res: Response) => {
  const { _user_id: user_id, pretext } = req.body
  const request_id = parseInt(req.params.id)

  try {
    new ValSchema({
      request_id: P.joi.number().positive().required(),
      pretext: P.joi.string().allow(null)
    }).validate({ request_id, pretext })

    const role_id = User.Role.Manage.find('moderator').get('role_id')

    const [request] = await User.Role.Request.find({ request_id, user_id, role_id })
    if (!request) throw new ArisError('Request not found!', 400)

    const data = { ...request.get('data'), pretext }

    await request.update({ data, status: 'awaiting' })

    return res.status(200).send({ success: true, message: 'Update complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

Router.post('/request/professor', auth, permission(['!professor']), async (req: Request, res: Response) => {
  const {
    _user_id: user_id,
    _roles: user_roles,
    voucher,
    university_id,
    campus_id,
    course_id,
    register,
    full_time,
    postgraduate,
    linkedin,
    lattes,
    orcid
  } = req.body

  try {
    new ValSchema({
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      full_time: P.joi.bool().required(),
      postgraduate: P.joi.bool().required(),
      linkedin: P.joi.string().allow(null),
      lattes: P.joi.string().allow(null),
      orcid: P.joi.string().allow(null)
    }).validate({ voucher, university_id, campus_id, course_id, register, full_time, postgraduate, linkedin, lattes, orcid })

    const requests = await User.Role.Request.find({ user_id, role_id: User.Role.Manage.find('professor').get('role_id') })
    if (requests.some(request => request.get('data')!.university_id === university_id)) throw new ArisError('Request already made!', 403)

    if (!voucher) {
      const emails = await User.Email.find({ user_id })
      if (!emails.some(email => email.get('university_id') === university_id))
        throw new ArisError('User doesn`t have an institutional email from this university!', 400)

      const [university] = await University.find({ university_id })
      if (!university) throw new ArisError('University not found!', 400)

      const regex = new RegExp(university.get('regex').email.professor)
      if (!emails.some(email => regex.test(email.get('address')))) throw new ArisError('User doesn`t have an institutional email for this role!', 400)

      await User.Role.Professor.create({ user_id, postgraduate, linkedin, lattes, orcid })
      await User.Role.Professor.Course.add({ user_id, university_id, campus_id, course_id, register, full_time })

      if (user_roles.some((role: string) => role === 'guest')) {
        const index = user_roles.findIndex((role: string) => role === 'guest')
        user_roles[index] = 'professor'
        await User.Role.remove(user_id, 'guest')
        await User.Role.add(user_id, 'professor')
        await User.updateAccessTokenData(user_id, user_roles)
      } else if (!user_roles.some((role: string) => role === 'professor')) {
        user_roles.push('professor')
        await User.Role.add(user_id, 'professor')
        await User.updateAccessTokenData(user_id, user_roles)
      }
    } else if (voucher) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      const voucher_uuid = await file.insert('documents', 'application/pdf')

      await User.Role.Request.create(
        user_id,
        'professor',
        { campus_id, university_id, course_id, register, full_time, postgraduate, linkedin, lattes, orcid },
        voucher_uuid
      )
    } else throw new ArisError('None of the flow data was provided (voucher | inst_email)', 400)

    return res.status(200).send({ success: true, message: 'Role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Role request')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/professor/:id', auth, async (req: Request, res: Response) => {
  const { _user_id: user_id, voucher, university_id, campus_id, course_id, register, full_time, postgraduate, linkedin, lattes, orcid } = req.body
  const request_id = parseInt(req.params.id)

  try {
    new ValSchema({
      request_id: P.joi.number().positive().required(),
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive(),
      campus_id: P.joi.number().positive(),
      course_id: P.joi.number().positive(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      full_time: P.joi.bool(),
      postgraduate: P.joi.bool(),
      linkedin: P.joi.string().allow(null),
      lattes: P.joi.string().allow(null),
      orcid: P.joi.string().allow(null)
    }).validate({ request_id, voucher, university_id, campus_id, course_id, register, full_time, postgraduate, linkedin, lattes, orcid })

    const role_id = User.Role.Manage.find('professor').get('role_id')

    const [request] = await User.Role.Request.find({ request_id, user_id, role_id })
    if (!request) throw new ArisError('Request not found!', 400)

    const data = { ...request.get('data'), university_id, campus_id, course_id, register, full_time, postgraduate, linkedin, lattes, orcid }

    let voucher_uuid = request.get('voucher_uuid')
    if (voucher) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      voucher_uuid = await file.insert('documents', 'application/pdf')
    }

    await request.update({ data, voucher_uuid, status: 'awaiting' })

    return res.status(200).send({ success: true, message: 'Update complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

Router.post('/request/student', auth, permission(['!student']), async (req: Request, res: Response) => {
  const { _user_id: user_id, _roles: user_roles, voucher, university_id, campus_id, course_id, register, semester, linkedin, lattes } = req.body

  try {
    new ValSchema({
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive().required(),
      campus_id: P.joi.number().positive().required(),
      course_id: P.joi.number().positive().required(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      semester: P.joi.number().min(1).max(10).required(),
      linkedin: P.joi.string().allow(null),
      lattes: P.joi.string().allow(null)
    }).validate({ voucher, university_id, campus_id, course_id, register, semester, linkedin, lattes })

    const requests = await User.Role.Request.find({ user_id, role_id: User.Role.Manage.find('student').get('role_id') })
    if (requests.some(request => request.get('data')!.university_id === university_id)) throw new ArisError('Request already made!', 403)

    if (!voucher) {
      const emails = await User.Email.find({ user_id })
      if (!emails.some(email => email.get('university_id') === university_id))
        throw new ArisError('User doesn`t have an institutional email from this university!', 400)

      const [university] = await University.find({ university_id })
      if (!university) throw new ArisError('University not found!', 400)

      const regex = new RegExp(university.get('regex').email.student)
      const email = emails.find(email => regex.test(email.get('address')))
      if (!email) throw new ArisError('User doesn`t have an institutional email for this role!', 400)
      const register = parseInt(email.get('address').split('@')[0])

      await User.Role.Student.create({ user_id, linkedin, lattes })
      await User.Role.Student.Course.add({ user_id, university_id, campus_id, course_id, register, semester })

      if (user_roles.some((role: string) => role === 'guest')) {
        const index = user_roles.findIndex((role: string) => role === 'guest')
        user_roles[index] = 'student'
        await User.Role.remove(user_id, 'guest')
        await User.Role.add(user_id, 'student')
        await User.updateAccessTokenData(user_id, user_roles)
      } else if (!user_roles.some((role: string) => role === 'student')) {
        user_roles.push('student')
        await User.Role.add(user_id, 'student')
        await User.updateAccessTokenData(user_id, user_roles)
      }
    } else if (voucher) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      const voucher_uuid = await file.insert('documents', 'application/pdf')

      await User.Role.Request.create(user_id, 'student', { campus_id, university_id, course_id, register, semester, linkedin, lattes }, voucher_uuid)
    } else throw new ArisError('None of the flow data was provided (voucher or inst_email)', 400)

    return res.status(200).send({ success: true, message: 'Role request sended!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Role request')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/student/:id', auth, async (req: Request, res: Response) => {
  const { _user_id: user_id, voucher, university_id, campus_id, course_id, register, semester, linkedin, lattes } = req.body
  const request_id = parseInt(req.params.id)

  try {
    new ValSchema({
      request_id: P.joi.number().positive().required(),
      voucher: P.joi.string().allow(null),
      university_id: P.joi.number().positive(),
      campus_id: P.joi.number().positive(),
      course_id: P.joi.number().positive(),
      register: P.joi.when('voucher', { then: P.joi.number().required() }),
      semester: P.joi.number().min(1).max(10),
      linkedin: P.joi.string().allow(null),
      lattes: P.joi.string().allow(null)
    }).validate({ request_id, voucher, university_id, campus_id, course_id, register, semester, linkedin, lattes })

    const role_id = User.Role.Manage.find('student').get('role_id')

    const [request] = await User.Role.Request.find({ request_id, user_id, role_id })
    if (!request) throw new ArisError('Request not found!', 400)

    const data = { ...request.get('data'), university_id, campus_id, course_id, register, semester, linkedin, lattes }

    let voucher_uuid = request.get('voucher_uuid')
    if (voucher) {
      const file = new File(voucher)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      voucher_uuid = await file.insert('documents', 'application/pdf')
    }

    await request.update({ data, voucher_uuid })

    return res.status(200).send({ success: true, message: 'Update complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

Router.patch('/request/accept/:id', auth, permission(['moderator', 'admin']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await User.Role.Request.find({ request_id, status: ['awaiting', 'rejected'] })
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

Router.patch('/request/reject/:id', auth, permission(['moderator', 'admin']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)
  const { feedback } = req.body

  try {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await User.Role.Request.find({ request_id, status: 'awaiting' })
    if (!request) throw new ArisError('Request not found!', 400)

    const [email] = await User.Email.find({ user_id: request.get('user_id'), main: true })

    await request.reject(feedback)
    await Mail.roleReqReject({ to: email.get('address'), message: feedback })

    return res.status(200).send({ success: true, message: 'Reject complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Reject')
    return res.status(result.status).send(result.send)
  }
})

Router.delete('/request/:id', auth, permission(['moderator', 'admin']), async (req: Request, res: Response) => {
  const request_id = parseInt(req.params.id)

  try {
    new ValSchema(P.joi.number().positive().required()).validate(request_id)

    const [request] = await User.Role.Request.find({ request_id })
    if (!request) throw new ArisError('Request not found!', 400)
    const voucher_uuid = request.get('voucher_uuid')
    await request.delete()
    voucher_uuid && (await File.delete('documents', voucher_uuid))

    return res.status(200).send({ success: true, message: 'Delete complete!' })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

Router.get('/request/voucher/:uuid', auth, async (req: Request, res: Response) => {
  const voucher_uuid = req.params.uuid

  try {
    new ValSchema(P.joi.string().required()).validate(voucher_uuid)

    const url = await File.get('documents', voucher_uuid)

    return res.status(200).send({ success: true, message: 'Fetch complete!', url })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
})

export default Router
