export const ANGLES = [
  { value: 'fear', label: 'Miedo', color: 'bg-red-500' },
  { value: 'desire', label: 'Deseo', color: 'bg-pink-500' },
  { value: 'curiosity', label: 'Curiosidad', color: 'bg-purple-500' },
  { value: 'offer', label: 'Oferta', color: 'bg-green-500' },
  { value: 'tutorial', label: 'Tutorial', color: 'bg-blue-500' },
  { value: 'testimonial', label: 'Testimonio', color: 'bg-yellow-500' },
] as const

export const FORMATS = [
  { value: 'static', label: 'Estático' },
  { value: 'video', label: 'Video' },
  { value: 'ugc', label: 'UGC' },
  { value: 'carousel', label: 'Carrusel' },
] as const

export const FUNNEL_STAGES = [
  { value: 'cold', label: 'Tráfico Frío' },
  { value: 'retargeting', label: 'Retargeting' },
] as const

export const SOURCE_TYPES = [
  { value: 'original', label: 'Original' },
  { value: 'competitor', label: 'Competencia' },
  { value: 'iteration', label: 'Iteración' },
] as const

export const STATUSES = [
  { value: 'idea', label: 'Banco de Ideas', color: 'bg-idea' },
  { value: 'development', label: 'Desarrollo', color: 'bg-cyan-500' },
  { value: 'production', label: 'Producción', color: 'bg-production' },
  { value: 'testing', label: 'Testeo Activo', color: 'bg-testing' },
  { value: 'analysis', label: 'Análisis Pendiente', color: 'bg-analysis' },
  { value: 'completed', label: 'Completado', color: 'bg-gray-500' },
] as const

export const RESULTS = [
  { value: 'winner', label: 'Winner', icon: '🏆', color: 'text-winner' },
  { value: 'loser', label: 'Loser', icon: '💀', color: 'text-loser' },
] as const

export const ACTIONS = [
  { value: 'iterate', label: 'Iterar (hacer v2.0)' },
  { value: 'kill', label: 'Matar (no repetir)' },
  { value: 'scale', label: 'Escalar (más presupuesto)' },
] as const

export const LEARNING_TYPES = [
  { value: 'insight', label: 'Insight' },
  { value: 'rule', label: 'Regla' },
  { value: 'warning', label: 'Advertencia' },
] as const

export type Angle = typeof ANGLES[number]['value']
export type Format = typeof FORMATS[number]['value']
export type FunnelStage = typeof FUNNEL_STAGES[number]['value']
export type SourceType = typeof SOURCE_TYPES[number]['value']
export type Status = typeof STATUSES[number]['value']
export type Result = typeof RESULTS[number]['value']
export type Action = typeof ACTIONS[number]['value']
export type LearningType = typeof LEARNING_TYPES[number]['value']
