'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ScoutFindingCard } from './ScoutFindingCard'
import {
  Filter,
  Bookmark,
  Loader2,
  Search,
} from 'lucide-react'

interface ScoutFinding {
  id: string
  type: string
  content: string
  sourceUrl: string | null
  creator: string | null
  engagement: string | null
  relevance: string
  relevanceReason: string
  category: string
  thumbnailUrl: string | null
  savedToResearch: boolean
  createdAt: string
}

interface ScoutFindingGridProps {
  findings: ScoutFinding[]
  onSaveFinding?: (findingId: string) => Promise<void>
  onSaveMultiple?: (findingIds: string[]) => Promise<void>
}

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'video', label: 'Videos' },
  { value: 'comment', label: 'Comentarios' },
  { value: 'trend', label: 'Tendencias' },
  { value: 'creator', label: 'Creadores' },
]

const RELEVANCE_OPTIONS = [
  { value: '', label: 'Toda relevancia' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas las categorias' },
  { value: 'pain_point', label: 'Pain Point' },
  { value: 'desire', label: 'Deseo' },
  { value: 'objection', label: 'Objecion' },
  { value: 'language', label: 'Lenguaje' },
  { value: 'trend', label: 'Tendencia' },
  { value: 'content_idea', label: 'Idea de contenido' },
]

export function ScoutFindingGrid({
  findings,
  onSaveFinding,
  onSaveMultiple,
}: ScoutFindingGridProps) {
  const [typeFilter, setTypeFilter] = useState('')
  const [relevanceFilter, setRelevanceFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSavingBulk, setIsSavingBulk] = useState(false)

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      if (typeFilter && f.type !== typeFilter) return false
      if (relevanceFilter && f.relevance !== relevanceFilter) return false
      if (categoryFilter && f.category !== categoryFilter) return false
      return true
    })
  }, [findings, typeFilter, relevanceFilter, categoryFilter])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  const selectAll = () => {
    const unsaved = filteredFindings.filter((f) => !f.savedToResearch)
    setSelectedIds(new Set(unsaved.map((f) => f.id)))
  }

  const deselectAll = () => {
    setSelectedIds(new Set())
  }

  const handleSaveSelected = async () => {
    if (!onSaveMultiple || selectedIds.size === 0) return
    setIsSavingBulk(true)
    try {
      await onSaveMultiple(Array.from(selectedIds))
      setSelectedIds(new Set())
    } catch {
      // error handled by parent
    } finally {
      setIsSavingBulk(false)
    }
  }

  if (findings.length === 0) {
    return (
      <div className="text-center py-12 bg-card border rounded-lg">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Sin hallazgos todavia</h3>
        <p className="text-muted-foreground">
          Los hallazgos apareceran aqui cuando la mision termine
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtrar:
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 px-2 rounded-md border border-input bg-background text-sm"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={relevanceFilter}
          onChange={(e) => setRelevanceFilter(e.target.value)}
          className="h-8 px-2 rounded-md border border-input bg-background text-sm"
        >
          {RELEVANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 px-2 rounded-md border border-input bg-background text-sm"
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground">
          {filteredFindings.length} de {findings.length} hallazgos
        </span>
      </div>

      {/* Bulk selection controls */}
      {onSaveMultiple && (
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Seleccionar todo
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAll}>
            Deseleccionar
          </Button>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              onClick={handleSaveSelected}
              disabled={isSavingBulk}
            >
              {isSavingBulk ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Bookmark className="h-3.5 w-3.5 mr-1" />
              )}
              Guardar {selectedIds.size} seleccionados
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFindings.map((finding) => (
          <ScoutFindingCard
            key={finding.id}
            finding={finding}
            selected={selectedIds.has(finding.id)}
            onToggleSelect={onSaveMultiple ? toggleSelect : undefined}
            onSave={onSaveFinding}
          />
        ))}
      </div>

      {filteredFindings.length === 0 && findings.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay hallazgos con estos filtros</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => {
              setTypeFilter('')
              setRelevanceFilter('')
              setCategoryFilter('')
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
