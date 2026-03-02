'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Video,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Music,
  ExternalLink,
  Bookmark,
  Check,
  Loader2,
  Hash,
} from 'lucide-react'

interface TikTokVideoData {
  id: string
  videoUrl: string
  description: string | null
  hashtags: string | null // JSON array
  creator: string | null
  views: number | null
  likes: number | null
  shares: number | null
  commentsCount: number | null
  thumbnailUrl: string | null
  musicTitle: string | null
  category: string | null
  relevanceScore: number | null
  savedToResearch: boolean
}

interface TikTokVideoCardProps {
  video: TikTokVideoData
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
  trend: {
    label: 'Tendencia',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  content_idea: {
    label: 'Idea de contenido',
    className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  },
}

function formatNumber(n: number | null | undefined) {
  if (n === undefined || n === null) return null
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export function TikTokVideoCard({
  video,
  selected,
  onToggleSelect,
  onSave,
}: TikTokVideoCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(video.savedToResearch)

  const categoryConfig = video.category ? CATEGORY_CONFIG[video.category] : null

  let hashtags: string[] = []
  if (video.hashtags) {
    try { hashtags = JSON.parse(video.hashtags) } catch { /* ignore */ }
  }

  const handleSave = async () => {
    if (saved || !onSave) return
    setIsSaving(true)
    try {
      await onSave(video.id)
      setSaved(true)
    } catch {
      // error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={`border rounded-lg bg-card overflow-hidden transition-all ${
        selected ? 'border-primary ring-1 ring-primary' : 'hover:border-muted-foreground/30'
      }`}
    >
      {/* Thumbnail */}
      {video.thumbnailUrl && (
        <div className="relative aspect-[9/16] max-h-48 bg-muted overflow-hidden">
          <img
            src={video.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          {video.views !== null && (
            <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {formatNumber(video.views)}
            </div>
          )}
        </div>
      )}

      <div className="p-3">
        {/* Header: badges + select */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Video className="h-3.5 w-3.5 text-muted-foreground" />
            {categoryConfig && (
              <Badge className={`text-[10px] px-1.5 py-0 ${categoryConfig.className}`}>
                {categoryConfig.label}
              </Badge>
            )}
            {video.relevanceScore !== null && video.relevanceScore > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {video.relevanceScore}%
              </span>
            )}
          </div>
          {onToggleSelect && (
            <button
              onClick={() => onToggleSelect(video.id)}
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

        {/* Creator */}
        {video.creator && (
          <p className="text-xs font-medium text-primary mb-1">{video.creator}</p>
        )}

        {/* Description */}
        {video.description && (
          <p className="text-sm line-clamp-3 mb-2">{video.description}</p>
        )}

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {hashtags.slice(0, 5).map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400">
                <Hash className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Music */}
        {video.musicTitle && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Music className="h-3 w-3" />
            <span className="line-clamp-1">{video.musicTitle}</span>
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground mb-2">
          {formatNumber(video.likes) && (
            <span className="inline-flex items-center gap-0.5">
              <Heart className="h-3 w-3" /> {formatNumber(video.likes)}
            </span>
          )}
          {formatNumber(video.commentsCount) && (
            <span className="inline-flex items-center gap-0.5">
              <MessageSquare className="h-3 w-3" /> {formatNumber(video.commentsCount)}
            </span>
          )}
          {formatNumber(video.shares) && (
            <span className="inline-flex items-center gap-0.5">
              <Share2 className="h-3 w-3" /> {formatNumber(video.shares)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          {video.videoUrl && (
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Ver en TikTok
            </a>
          )}
          <div className="flex-1" />
          {saved ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3 w-3" />
              Guardado
            </span>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
