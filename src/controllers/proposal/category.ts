import Category from '../../database/models/proposal/category'
import permission from '../../middlewares/permission'
import ArisError from '../../utils/arisError'
import Data from '../../utils/data'

import express, { Request, Response } from 'express'
const route = express.Router()

route.get('/get', async (req: Request, res: Response) => {
  try {
    const categories = await Category.get.allCategories()
    res.status(200).send({ success: true, message: 'Fecth complete!', categories })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
})

route.post('/post', permission(['admin']), async (req: Request, res: Response) => {
  const { name, icon, description } = req.body

  try {
    Data.validate({ name, icon, description }, 'category_post')

    const category = new Category({ name, icon, description })
    await category.insert()

    res.status(200).send({ success: true, message: 'Category created!', category })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Creation')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update/:id', permission(['admin']), async (req: Request, res: Response) => {
  const { name, icon, description } = req.body
  const category_id = parseInt(req.params.id)

  try {
    Data.validate({ name, icon, description }, 'category_patch')

    const category = await Category.getCategory(category_id)
    await category.update({ name, icon, description })

    res.status(200).send({
      success: true,
      message: 'Category updated!',
      category_id,
      name: name || 'Not updated',
      icon: icon || 'Not updated',
      description: description || 'Not updated'
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Update')
    return res.status(result.status).send(result.send)
  }
})

route.post('/delete/:id', permission(['admin']), async (req: Request, res: Response) => {
  const category_id = parseInt(req.params.id)

  try {
    const category = await Category.getCategory(category_id)
    await category.delete()

    res.status(200).send({
      success: true,
      message: 'Category deleted!',
      category_id
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
