"use client"

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdCard } from './AdCard'
import { cn } from '@/lib/utils'
import Link from 'next/link'

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

interface KanbanColumnProps {
  id: string
  title: string
  description?: string
  ads: Ad[]
  color: string
  showLockIcon?: boolean
}

export function KanbanColumn({ id, title, description, ads, color, showLockIcon }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-72 min-h-[500px] bg-muted/30 rounded-lg p-3",
        isOver && "ring-2 ring-primary bg-muted/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <h3 className="font-semibold">{title}</h3>
          {showLockIcon && <Lock className="h-4 w-4 text-amber-500" />}
          <span className="text-sm text-muted-foreground">({ads.length})</span>
        </div>
        {id === 'idea' && (
          <Link href="/ads/new?status=idea">
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
      )}

      {/* Cards */}
      <SortableContext items={ads.map(ad => ad.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </SortableContext>

      {/* Empty State */}
      {ads.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Sin anuncios
        </div>
      )}
    </div>
  )
}
