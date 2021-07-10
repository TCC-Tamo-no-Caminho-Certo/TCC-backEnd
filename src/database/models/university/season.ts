import { Model, Foreign, IModel } from '..'

interface SeasonPeriods {
  dispatch: string
  evaluate: string
  confirm: string
  in_progress: string
  complete: string
}

interface Season extends SeasonPeriods {
  university_id: Foreign
  title: string
  description: string | null
  current_period: keyof SeasonPeriods
}

type SeasonUp = Partial<Omit<Season, 'university_id' | 'current_period'>>

const SeasonModel = new Model<Season, SeasonUp>('season', { foreign: ['university_id'] })

type ISeasonModel = IModel<Season, SeasonUp>

export { SeasonModel, ISeasonModel }
