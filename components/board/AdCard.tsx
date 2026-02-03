"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lock, Image as ImageIcon, Clock, AlertTriangle, GripVertical, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ANGLES } from '@/lib/constants'
import { getDaysRemaining } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface Ad {
  id: string
  name: string
  concept: string
  angleType: string
  format: string
  status: string
  isLocked: boolean
  reviewDate: string | null
  thumbnailUrl: string | null
  result: string | null
  dueDate: string | null
}

interface AdCardProps {
  ad: Ad
  isDragging?: boolean
}

export function AdCard({ ad, isDragging }: AdCardProps) {
  const router = useRouter()

  // Solo bloquear drag si esta en testing Y esta bloqueado
  const isActuallyLocked = ad.isLocked && ad.status === 'testing'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: ad.id, disabled: isActuallyLocked })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const daysRemaining = getDaysRemaining(ad.reviewDate)
  const angleConfig = ANGLES.find(a => a.value === ad.angleType)

  // Calculate due date status
  const getDueDateStatus = () => {
    if (!ad.dueDate) return null
    const now = new Date()
    const due = new Date(ad.dueDate)
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Vencido', color: 'bg-red-500', urgent: true }
    if (diffDays === 0) return { text: 'Hoy', color: 'bg-red-500', urgent: true }
    if (diffDays === 1) return { text: 'Manana', color: 'bg-orange-500', urgent: true }
    if (diffDays <= 3) return { text: `${diffDays}d`, color: 'bg-orange-500', urgent: false }
    return { text: `${diffDays}d`, color: 'bg-blue-500', urgent: false }
  }

  const dueDateStatus = getDueDateStatus()

  const handleCardClick = (e: React.MouseEvent) => {
    // No navegar si se hizo click en el drag handle
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      return
    }
    router.push(`/ads/${ad.id}`)
  }

  // Texto del boton segun el estado
  const getActionText = () => {
    if (ad.status === 'analysis') return 'Analizar'
    if (ad.status === 'idea') return 'Editar'
    return 'Ver'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative bg-card rounded-lg border shadow-sm
        ${isDragging ? 'opacity-50 ring-2 ring-primary' : ''}
        ${isActuallyLocked ? 'opacity-75' : ''}
        hover:shadow-md transition-shadow
      `}
    >
      {/* Drag Handle - Area para arrastrar */}
      <div
        {...attributes}
        {...listeners}
        data-drag-handle
        className={`
          absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center
          bg-muted/50 rounded-l-lg cursor-grab active:cursor-grabbing
          hover:bg-muted transition-colors
          ${isActuallyLocked ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Contenido clickeable */}
      <div
        onClick={handleCardClick}
        className="pl-7 p-3 cursor-pointer"
      >
        {/* Lock Overlay - solo mostrar si esta en testing y bloqueado */}
        {isActuallyLocked && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
            <Lock className="h-3 w-3" />
            {daysRemaining}d
          </div>
        )}

        {/* Due Date Badge - mostrar si hay fecha limite y no esta bloqueado */}
        {dueDateStatus && !isActuallyLocked && !ad.result && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 ${dueDateStatus.color} text-white px-2 py-0.5 rounded-full text-xs font-medium`}>
            {dueDateStatus.urgent ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {dueDateStatus.text}
          </div>
        )}

        {/* Result Badge */}
        {ad.result && (
          <div className="absolute top-2 right-2">
            <Badge variant={ad.result as 'winner' | 'loser'}>
              {ad.result === 'winner' ? 'Winner' : 'Loser'}
            </Badge>
          </div>
        )}

        {/* Thumbnail */}
        <div className="w-full h-20 bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
          {ad.thumbnailUrl ? (
            <img
              src={ad.thumbnailUrl}
              alt={ad.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <h4 className="font-medium text-sm truncate mb-1 hover:text-primary">
          {ad.concept}
        </h4>

        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant={ad.angleType as 'fear' | 'desire' | 'curiosity' | 'offer' | 'tutorial' | 'testimonial'} className="text-xs">
            {angleConfig?.label || ad.angleType}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {ad.format}
          </Badge>
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          variant={ad.status === 'analysis' ? 'default' : 'outline'}
          className="w-full h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/ads/${ad.id}`)
          }}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          {getActionText()}
        </Button>
      </div>
    </div>
  )
}
