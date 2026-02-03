import { formatDate } from './utils'
import { ANGLES, type Angle, type Format } from './constants'

function sanitize(str: string): string {
  return str
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '')
    .slice(0, 20)
}

function getAngleLabel(angleType: Angle): string {
  const found = ANGLES.find(a => a.value === angleType)
  return found ? found.label : angleType
}

function getFormatLabel(format: Format): string {
  return format.toUpperCase()
}

export function generateAdName(
  concept: string,
  angleType: Angle,
  format: Format,
  date?: Date
): string {
  const dateStr = formatDate(date || new Date())
  const conceptClean = sanitize(concept)
  const angleLabel = sanitize(getAngleLabel(angleType))
  const formatLabel = getFormatLabel(format)

  return `${dateStr}_${conceptClean}_${angleLabel}_${formatLabel}`
}
