import { Model, Increment, Foreign, IModel } from '..'

interface SeasonPeriods {
  dispatch: number
  evaluate: number
  confirm: number
  in_progress: number
}

type SeasonStatus = 'pre_release' | 'release' | 'canceled' | 'archived'

interface Season {
  id: Increment
  university_id: Foreign
  title: string
  status: SeasonStatus
  begin: string
  edict_uuid: string
  periods: SeasonPeriods
  current_period: 'on_hold' | keyof SeasonPeriods | 'complete'
  description: string | null
}

const SeasonModel = new Model<Season>('season', { foreign: ['university_id'] })

type ISeasonModel = IModel<Season>

export { SeasonModel, ISeasonModel }
