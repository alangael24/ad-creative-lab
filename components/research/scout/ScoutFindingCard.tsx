'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Video,
  MessageSquare,
  TrendingUp,
  UserCircle,
  ExternalLink,
  Bookmark,
  Check,
  Loader2,
} from 'lucide-react'
import { RESEARCH_CATEGORIES } from '@/lib/constants'

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

interface ScoutFindingCardProps {
  finding: ScoutFinding
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onSave?: (id: string) => Promise<void>
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Video }> = {
  video: { label: 'Video', icon: Video },
  comment: { label: 'Comentario', icon: MessageSquare },
  trend: { label: 'Tendencia', icon: TrendingUp },
  creator: { label: 'Creador', icon: UserCircle },
}

const RELEVANCE_CONFIG: Record<string, { label: string; className: string }> = {
  high: {
    label: 'Alta',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  medium: {
    label: 'Media',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  low: {
    label: 'Baja',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  },
}

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  pain_point: {
    label: 'Pain Point',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
  desire: {
    label: 'Deseo',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  objection: {
    label: 'Objecion',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  language: {
    label: 'Lenguaje',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  trend: {
    label: 'Tendencia',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  content_idea: {
    label: 'Idea de contenido',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  },
}

export function ScoutFindingCard({
  finding,
  selected,
  onToggleSelect,
  onSave,
}: ScoutFindingCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(finding.savedToResearch)

  const typeConfig = TYPE_CONFIG[finding.type] || TYPE_CONFIG.video
  const TypeIcon = typeConfig.icon
  const relevanceConfig = RELEVANCE_CONFIG[finding.relevance] || RELEVANCE_CONFIG.medium
  const categoryConfig = CATEGORY_CONFIG[finding.category] || CATEGORY_CONFIG.pain_point

  let engagement: { likes?: number; comments?: number; shares?: number; views?: number } | null = null
  if (finding.engagement) {
    try {
      engagement = JSON.parse(finding.engagement)
    } catch { /* ignore */ }
  }

  const handleSave = async () => {
    if (saved || !onSave) return
    setIsSaving(true)
    try {
      await onSave(finding.id)
      setSaved(true)
    } catch {
      // error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  const formatNumber = (n: number | undefined) => {
    if (n === undefined || n === null) return null
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div
      className={`border rounded-lg bg-card p-4 transition-all ${
        selected ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/30'
      }`}
    >
      {/* Header row: type icon + badges */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <TypeIcon className="h-4 w-4" />
            <span className="text-xs font-medium">{typeConfig.label}</span>
          </div>
          <Badge className={`text-xs ${relevanceConfig.className}`}>
            {relevanceConfig.label}
          </Badge>
          <Badge className={`text-xs ${categoryConfig.className}`}>
            {categoryConfig.label}
          </Badge>
        </div>
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(finding.id)}
            className={`h-5 w-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              selected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-muted-foreground/30 hover:border-primary'
            }`}
          >
            {selected && <Check className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Content */}
      <p className="text-sm mb-2">{finding.content}</p>

      {/* Relevance reason */}
      <p className="text-xs text-muted-foreground italic mb-3">
        {finding.relevanceReason}
      </p>

      {/* Creator */}
      {finding.creator && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <UserCircle className="h-3.5 w-3.5" />
          <span>@{finding.creator}</span>
        </div>
      )}

      {/* Engagement stats */}
      {engagement && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          {formatNumber(engagement.views) && (
            <span>{formatNumber(engagement.views)} vistas</span>
          )}
          {formatNumber(engagement.likes) && (
            <span>{formatNumber(engagement.likes)} likes</span>
          )}
          {formatNumber(engagement.comments) && (
            <span>{formatNumber(engagement.comments)} comments</span>
          )}
          {formatNumber(engagement.shares) && (
            <span>{formatNumber(engagement.shares)} shares</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t">
        {finding.sourceUrl && (
          <a
            href={finding.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver en TikTok
          </a>
        )}
        <div className="flex-1" />
        {saved ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
            <Check className="h-3.5 w-3.5" />
            Guardado
          </span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Bookmark className="h-3.5 w-3.5 mr-1" />
            )}
            Guardar como Research
          </Button>
        )}
      </div>
    </div>
  )
}
