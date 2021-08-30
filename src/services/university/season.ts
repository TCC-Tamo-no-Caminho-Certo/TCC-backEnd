import { SeasonModel, ISeasonModel } from '../../database/models/university/season'

import ValSchema, { P } from '../../utils/validation'
import ArisError from '../../utils/arisError'
import File from '../../utils/minio'

import { Pagination } from '../../@types/types'

export class SeasonSubService {
  private SeasonModel: ISeasonModel

  constructor(Season: ISeasonModel) {
    this.SeasonModel = Season
  }

  async add(university_id: number, season_data: any) {
    new ValSchema({
      university_id: P.joi.number().positive().required(),
      season_data: P.joi
        .object({
          title: P.joi.string().required(),
          begin: P.joi.date().required(),
          edict: P.joi.string().required(),
          periods: P.joi
            .object({
              dispatch: P.joi.number().integer().positive().less(60).required(),
              evaluate: P.joi.number().integer().positive().less(60).required(),
              confirm: P.joi.number().integer().positive().less(60).required(),
              in_progress: P.joi.number().integer().positive().less(60).required()
            })
            .required(),
          description: P.joi.string().allow(null)
        })
        .required()
    }).validate({ university_id, season_data })

    season_data.university_id = university_id
    season_data.periods = JSON.stringify(season_data.periods)

    const { edict } = season_data
    delete season_data.edict

    const file = new File(edict)
    if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

    season_data.edict_uuid = await file.insert('edict')

    const seasons = await this.SeasonModel.find({ university_id })

    const is_valid = seasons.some(season => {
      const time_diff = new Date(season.begin).getTime() - new Date(season_data.begin).getTime(),
        day_diff = Math.floor(time_diff / (1000 * 3600 * 24))

      return day_diff < 0 ? day_diff + season.periods.dispatch <= 0 : day_diff - season_data.periods.dispatch >= 0
    })

    if (!is_valid && seasons.length !== 0) throw new ArisError('Season not valid!', 400)

    const new_season = await this.SeasonModel.insert(season_data)
    return new_season
  }

  async update(primary: any, update_data: any) {
    new ValSchema({
      primary: P.joi
        .object({
          id: P.joi.number().positive().required(),
          university_id: P.joi.number().positive().required()
        })
        .required(),
      update_data: P.joi
        .object({
          title: P.joi.string(),
          begin: P.joi.date(),
          edict: P.joi.string(),
          periods: P.joi
            .object({
              dispatch: P.joi.number().integer().positive().less(60),
              evaluate: P.joi.number().integer().positive().less(60),
              confirm: P.joi.number().integer().positive().less(60),
              in_progress: P.joi.number().integer().positive().less(60)
            })
            .required(),
          description: P.joi.string().allow(null)
        })
        .required()
    }).validate({ primary, update_data })

    const { edict, periods } = update_data

    let old_season_data: any = null
    if (periods) {
      const seasons = await this.SeasonModel.find({ university_id: primary.university_id }).then(seasons =>
        seasons.filter(season => {
          const is_old_season = season.id === primary.id
          if (is_old_season) old_season_data = season
          return !is_old_season
        })
      )

      if (!old_season_data) throw new ArisError('Season not found!', 400)

      const new_periods = { ...old_season_data.periods, ...update_data.periods }

      const is_valid = seasons.some(season => {
        const time_diff = new Date(season.begin).getTime() - new Date(update_data.begin || old_season_data.begin).getTime(),
          day_diff = Math.floor(time_diff / (1000 * 3600 * 24))

        return day_diff < 0 ? day_diff + season.periods.dispatch <= 0 : day_diff - new_periods.dispatch >= 0
      })

      if (!is_valid && seasons.length !== 0) throw new ArisError('Season not valid!', 400)

      update_data.periods = JSON.stringify(new_periods)
    }

    if (edict) {
      old_season_data ||= await this.SeasonModel.find(primary).then(row => row[0])
      if (!old_season_data) throw new ArisError('Season not found!', 400)

      const file = new File(edict)
      if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

      update_data.edict_uuid = await file.update('edict', old_season_data.edict_uuid)

      delete update_data.edict
    }

    await this.SeasonModel.update(primary, update_data)
  }

  async delete(primary: any) {
    new ValSchema({
      id: P.joi.number().positive().required(),
      university_id: P.joi.number().positive().required()
    }).validate(primary)

    await this.SeasonModel.delete(primary)
  }

  async find(filter: any, { page, per_page }: Pagination) {
    const seasons = await this.SeasonModel.find(filter)
      .select('id', 'university_id', 'title', 'status', 'begin', 'current_period', 'periods', 'description')
      .paginate(page, per_page)
    return seasons
  }
}

export default new SeasonSubService(SeasonModel)
