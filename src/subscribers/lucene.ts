import Lucene from '../services/lucene'
import { emitter } from './'

emitter.on('ConfirmSingUp', async ({ user_data }) => {
  if (Lucene.enabled) await Lucene.add({ id: user_data.user_id, name: user_data.fullname })
})

emitter.on('User_Update', async ({ user_data, update_data }) => {
  const { name, surname } = update_data
  if (name || surname) {
    if (Lucene.enabled) {
      await Lucene.delete(user_data.user_id)
      await Lucene.add({ id: user_data.user_id, name: `${name ? name : user_data.name} ${surname ? surname : user_data.surname}` })
    }
  }
})
