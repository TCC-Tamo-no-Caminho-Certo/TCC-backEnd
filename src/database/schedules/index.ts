import schedule from 'node-schedule'
import { SeasonModel } from '../models/university/season'
import { RoleRequestModel } from '../models/user/role_request'

schedule.scheduleJob('* 0 * * *', async function () {
  try {
    const seasons = await SeasonModel.query.whereNot({ current_period: 'complete' }).where('begin', '>=', Date.now())
    await SeasonModel.createTrx()
    for (const season of seasons) {
      const { periods } = season

      const update_data: Partial<typeof season> = {}

      const timeDifference = new Date().getTime() - new Date(season.begin).getTime(),
        dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24))

      if (dayDifference <= periods.dispatch) {
        update_data.current_period = 'dispatch'
        update_data.status = 'release'
      } else if (dayDifference <= periods.evaluate) update_data.current_period = 'evaluate'
      else if (dayDifference <= periods.confirm) update_data.current_period = 'confirm'
      else {
        update_data.current_period = 'complete'
        update_data.status = 'archived'
      }

      await SeasonModel.update(season, <any>update_data)
    }
    await SeasonModel.commitTrx()
  } catch (error) {
    console.log(error)
  }
})

schedule.scheduleJob('delete_role_request', '* * * * 0', async function () {
  try {
    await RoleRequestModel.query.del().whereIn('status', ['accepted', 'rejected']).whereRaw('TIMESTAMPDIFF(MONTH, `updated_at`, NOW()) >= 1')
  } catch (error) {
    console.log(error)
  }
})
