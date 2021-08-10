export type RoleTypes = 'developer' | 'guest' | 'student' | 'professor' | 'customer' | 'evaluator' | 'moderator' | 'administrator'

export type CourseTypes =
  | 'Ciência da Computação'
  | 'Engenharia da Computação'
  | 'Engenharia Mecânica'
  | 'Engenharia de Produção'
  | 'Sistemas de Informação'

export type Pagination = { page?: number; per_page?: number }
