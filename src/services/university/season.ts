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
          status: P.joi.forbidden().default('pre-release'), // .equal('pre-release')
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
          current_period: P.joi.forbidden().default('on_hold'),
          description: P.joi.string().allow(null)
        })
        .required()
    }).validate({ university_id, season_data })

    const { edict } = season_data
    delete season_data.edict

    const file = new File(edict)
    if (!file.validateTypes(['data:application/pdf;base64'])) throw new ArisError('Invalid file Type!', 400)

    season_data.edict_uuid = await file.insert('edict')

    const seasons = await this.SeasonModel.find({ university_id })

    const is_valid = seasons.some(season => {
      const timeDifference = new Date(season.begin).getTime() - new Date(season_data.begin).getTime(),
        dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24))

      return dayDifference < 0 ? dayDifference + season.periods.dispatch <= 0 : dayDifference - season_data.periods.dispatch >= 0
    })

    if (!is_valid) throw new ArisError('Season not valid', 400)

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
          university_id: P.joi.number().positive().required(),
          title: P.joi.string().required(),
          description: P.joi.string().allow(null),
          current_period: P.joi.string().equal('dispatch', 'evaluate', 'confirm', 'in_progress', 'complete'),
          dispatch: P.joi.date().required(),
          evaluate: P.joi.date().required(),
          confirm: P.joi.date().required(),
          in_progress: P.joi.date().required(),
          complete: P.joi.date().required()
        })
        .required()
    }).validate({ primary, update_data })

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
