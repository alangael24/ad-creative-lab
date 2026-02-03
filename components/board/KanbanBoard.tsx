"use client"

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { AdCard } from './AdCard'
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
  hypothesis: string
  dueDate: string | null
}

interface KanbanBoardProps {
  initialAds: Ad[]
}

const COLUMNS = [
  {
    id: 'idea',
    title: 'Banco de Ideas',
    description: 'Ideas sin filtrar, dump libre',
    color: 'bg-indigo-500',
  },
  {
    id: 'development',
    title: 'Desarrollo',
    description: 'Guiones, hooks, bocetos',
    color: 'bg-cyan-500',
  },
  {
    id: 'production',
    title: 'Produccion',
    description: 'Creando el anuncio',
    color: 'bg-blue-500',
  },
  {
    id: 'testing',
    title: 'Testeo Activo',
    description: 'Bloqueado por 10 dias',
    color: 'bg-amber-500',
    showLockIcon: true,
  },
  {
    id: 'analysis',
    title: 'Analisis Pendiente',
    description: 'Listos para post-mortem',
    color: 'bg-violet-500',
  },
]

export function KanbanBoard({ initialAds }: KanbanBoardProps) {
  const [ads, setAds] = useState<Ad[]>(initialAds)
  const [activeAd, setActiveAd] = useState<Ad | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Refetch ads periodically to check for auto-moves
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/ads')
        .then(res => res.json())
        .then(data => setAds(data))
        .catch(console.error)
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const ad = ads.find(a => a.id === event.active.id)
    if (ad) {
      setActiveAd(ad)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveAd(null)
    setError(null)

    const { active, over } = event
    if (!over) return

    const adId = active.id as string
    const ad = ads.find(a => a.id === adId)
    if (!ad) return

    // Determine target column
    let targetStatus = over.id as string
    // If dropped on another card, find its column
    const overAd = ads.find(a => a.id === over.id)
    if (overAd) {
      targetStatus = overAd.status
    }

    // Don't do anything if same column
    if (ad.status === targetStatus) return

    // Validation: Can't move locked ads that are in testing
    if (ad.isLocked && ad.status === 'testing') {
      setError('Este anuncio esta bloqueado en testeo. Espera a que termine el periodo de prueba.')
      return
    }

    // Validation: Need hypothesis to move to production
    if (targetStatus === 'production' && !ad.hypothesis) {
      setError('Necesitas agregar una hipotesis antes de mover a produccion.')
      return
    }

    // Optimistic update - use functional setState to avoid stale state
    let previousAds: typeof ads = []
    setAds(prevAds => {
      previousAds = prevAds
      return prevAds.map(a =>
        a.id === adId
          ? { ...a, status: targetStatus, isLocked: targetStatus === 'testing' }
          : a
      )
    })

    try {
      const response = await fetch(`/api/ads/${adId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al mover el anuncio')
      }

      const updatedAd = await response.json()
      setAds(prevAds => prevAds.map(a => a.id === adId ? updatedAd : a))
      router.refresh()
    } catch (err) {
      // Rollback on error
      setAds(previousAds)
      setError(err instanceof Error ? err.message : 'Error al mover el anuncio')
    }
  }

  const getColumnAds = (status: string) =>
    ads.filter(ad => ad.status === status)

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              description={column.description}
              ads={getColumnAds(column.id)}
              color={column.color}
              showLockIcon={column.showLockIcon}
            />
          ))}
        </div>

        <DragOverlay>
          {activeAd && <AdCard ad={activeAd} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
