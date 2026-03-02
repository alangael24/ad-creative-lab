'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Check,
  Loader2,
  Reply,
} from 'lucide-react'

interface TikTokCommentData {
  id: string
  username: string
  commentText: string
  likes: number
  timestamp: string | null
  replyTo: string | null
  category: string | null
  sentiment: string | null
  relevanceScore: number | null
  savedToResearch: boolean
}

interface TikTokCommentCardProps {
  comment: TikTokCommentData
  selected?: boolean
  onToggleSelect?: (id: string) => void
  onSave?: (id: string) => Promise<void>
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
  neutral: {
    label: 'Neutral',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  },
}

const SENTIMENT_CONFIG: Record<string, { label: string; className: string }> = {
  positive: {
    label: 'Positivo',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  negative: {
    label: 'Negativo',
    className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  },
  neutral: {
    label: 'Neutral',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  },
}

export function TikTokCommentCard({
  comment,
  selected,
  onToggleSelect,
  onSave,
}: TikTokCommentCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(comment.savedToResearch)

  const categoryConfig = comment.category ? CATEGORY_CONFIG[comment.category] : null
  const sentimentConfig = comment.sentiment ? SENTIMENT_CONFIG[comment.sentiment] : null

  const handleSave = async () => {
    if (saved || !onSave) return
    setIsSaving(true)
    try {
      await onSave(comment.id)
      setSaved(true)
    } catch {
      // error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={`border rounded-lg bg-card p-3 transition-all ${
        selected ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/30'
      } ${comment.category === 'neutral' ? 'opacity-50' : ''}`}
    >
      {/* Header: username + badges */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-primary">{comment.username}</span>
          {comment.replyTo && (
            <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
              <Reply className="h-3 w-3" />
              reply
            </span>
          )}
          {categoryConfig && (
            <Badge className={`text-[10px] px-1.5 py-0 ${categoryConfig.className}`}>
              {categoryConfig.label}
            </Badge>
          )}
          {sentimentConfig && (
            <Badge className={`text-[10px] px-1.5 py-0 ${sentimentConfig.className}`}>
              {sentimentConfig.label}
            </Badge>
          )}
          {comment.relevanceScore !== null && comment.relevanceScore > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {comment.relevanceScore}%
            </span>
          )}
        </div>
        {onToggleSelect && (
          <button
            onClick={() => onToggleSelect(comment.id)}
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

      {/* Comment text */}
      <p className="text-sm mb-2">{comment.commentText}</p>

      {/* Footer: likes + timestamp + save */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1.5 border-t">
        {comment.likes > 0 && (
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {comment.likes >= 1000 ? `${(comment.likes / 1000).toFixed(1)}K` : comment.likes}
          </span>
        )}
        {comment.timestamp && <span>{comment.timestamp}</span>}
        <div className="flex-1" />
        {saved ? (
          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
            <Check className="h-3 w-3" />
            Guardado
          </span>
        ) : comment.category && comment.category !== 'neutral' ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Bookmark className="h-3 w-3 mr-1" />
            )}
            Guardar
          </Button>
        ) : null}
      </div>
    </div>
  )
}
