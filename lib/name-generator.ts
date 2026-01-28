import { formatDate } from './utils'
import { ANGLES, type Angle, type Format } from './constants'

function sanitize(str: string): string {
  return str
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '')
    .slice(0, 20)
}

function getAngleLabel(angle: Angle): string {
  const found = ANGLES.find(a => a.value === angle)
  return found ? found.label : angle
}

function getFormatLabel(format: Format): string {
  return format.toUpperCase()
}

export function generateAdName(
  concept: string,
  angle: Angle,
  format: Format,
  date?: Date
): string {
  const dateStr = formatDate(date || new Date())
  const conceptClean = sanitize(concept)
  const angleLabel = sanitize(getAngleLabel(angle))
  const formatLabel = getFormatLabel(format)

  return `${dateStr}_${conceptClean}_${angleLabel}_${formatLabel}`
}
