import schedule from 'node-schedule'
import { SeasonModel } from '../models/university/season'
import { RoleRequestModel } from '../models/user/role_request'

class Jobs {
  initialize() {
    schedule.scheduleJob('* 0 * * *', async function () {
      try {
        const now = new Date()
        await SeasonModel.createTrx()
        const seasons = await SeasonModel.query.where('begin', '<=', now).andWhereNot({ current_period: 'complete' })

        for (const season of seasons) {
          const {
            id,
            university_id,
            periods: { dispatch, evaluate, confirm }
          } = season

          const update_data: Partial<typeof season> = {}

          const timeDiff = now.getTime() - new Date(season.begin).getTime(),
            dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24))

          if (dayDiff <= dispatch) {
            update_data.current_period = 'dispatch'
            update_data.status = 'release'
          } else if (dayDiff - dispatch <= evaluate) update_data.current_period = 'evaluate'
          else if (dayDiff - (dispatch + evaluate) <= confirm) update_data.current_period = 'confirm'
          else {
            update_data.current_period = 'complete'
            update_data.status = 'archived'
          }

          await SeasonModel.update({ id, university_id }, <any>update_data)
        }
        await SeasonModel.commitTrx()
      } catch (error) {
        await SeasonModel.rollbackTrx()
        console.log(error)
      }
    })

    schedule.scheduleJob('delete_role_request', '* * * * 0', async function () {
      try {
        await RoleRequestModel.createTrx()
        await RoleRequestModel.query.del().whereIn('status', ['accepted', 'rejected']).whereRaw('TIMESTAMPDIFF(MONTH, `updated_at`, NOW()) >= 1')
        await RoleRequestModel.commitTrx()
      } catch (error) {
        await RoleRequestModel.rollbackTrx()
        console.log(error)
      }
    })
  }
}

export default new Jobs()
