import Category from '../../../models/proposal/categoryModel'
import ArisError from '../../../models/arisErrorModel'
import { admin } from '../../../middlewares/permition'
import express, { Request, Response } from 'express'
import Data from '../../../models/dataModel'
const route = express.Router()

route.post('/get', async (req: Request, res: Response) => {
  try {
    const categories = await Category.get.allCategories()
    res.status(200).send({ Success: true, Message: 'Fecth complete!', categories })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Fetch')
    return res.status(result.status).send(result.send)
  }
})

route.post('/post', admin, async (req: Request, res: Response) => {
  const { name, icon, description } = req.body

  try {
    Data.validate({ name, icon, description }, 'category_post')

    const category = new Category({ name, icon, description })
    await category.insert()

    res.status(200).send({ Success: true, Message: 'Category created!', category })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Creation')
    return res.status(result.status).send(result.send)
  }
})

route.post('/update/:id', admin, async (req: Request, res: Response) => {
  const { name, icon, description } = req.body
  const category_id = parseInt(req.params.id)

  try {
    Data.validate({ name, icon, description }, 'category_patch')

    const category = await Category.getCategory(category_id)
    await category.update({ name, icon, description })

    res.status(200).send({
      Success: true,
      Message: 'Category updated!',
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

route.post('/delete/:id', admin, async (req: Request, res: Response) => {
  const category_id = parseInt(req.params.id)

  try {
    const category = await Category.getCategory(category_id)
    await category.delete()

    res.status(200).send({
      Success: true,
      Message: 'Category deleted!',
      category_id
    })
  } catch (error) {
    const result = ArisError.errorHandler(error, 'Delete')
    return res.status(result.status).send(result.send)
  }
})

export default route
