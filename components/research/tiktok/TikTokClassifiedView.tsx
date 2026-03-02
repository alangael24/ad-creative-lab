'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TikTokCommentCard } from './TikTokCommentCard'
import {
  Target,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  MinusCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ClassifiedComment {
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

interface TikTokClassifiedViewProps {
  comments: ClassifiedComment[]
  onSave: (id: string) => Promise<void>
}

const GROUPS = [
  {
    key: 'pain_point',
    label: 'Pain Points',
    icon: Target,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  {
    key: 'desire',
    label: 'Deseos',
    icon: Sparkles,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    key: 'objection',
    label: 'Objeciones',
    icon: ShieldAlert,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    key: 'language',
    label: 'Lenguaje',
    icon: MessageSquare,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    key: 'neutral',
    label: 'Neutral',
    icon: MinusCircle,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-950/30',
    borderColor: 'border-gray-200 dark:border-gray-800',
  },
]

export function TikTokClassifiedView({ comments, onSave }: TikTokClassifiedViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set(['neutral']))

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Group comments by category
  const grouped = GROUPS.map(group => ({
    ...group,
    comments: comments
      .filter(c => c.category === group.key)
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)),
  }))

  // Unclassified (no category)
  const unclassified = comments.filter(c => !c.category)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {grouped.filter(g => g.comments.length > 0).map(group => {
          const Icon = group.icon
          return (
            <div key={group.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${group.bgColor} border ${group.borderColor}`}>
              <Icon className={`h-3.5 w-3.5 ${group.color}`} />
              <span className={`text-xs font-medium ${group.color}`}>
                {group.comments.length}
              </span>
            </div>
          )
        })}
      </div>

      {/* Grouped sections */}
      {grouped.filter(g => g.comments.length > 0).map(group => {
        const Icon = group.icon
        const isCollapsed = collapsedGroups.has(group.key)

        return (
          <div key={group.key} className={`border rounded-lg overflow-hidden ${group.borderColor}`}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.key)}
              className={`w-full flex items-center justify-between p-3 ${group.bgColor} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${group.color}`} />
                <span className={`text-sm font-medium ${group.color}`}>
                  {group.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({group.comments.length})
                </span>
              </div>
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Comments */}
            {!isCollapsed && (
              <div className="p-3 space-y-2">
                {group.comments.map(comment => (
                  <TikTokCommentCard
                    key={comment.id}
                    comment={comment}
                    onSave={onSave}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Unclassified */}
      {unclassified.length > 0 && (
        <div className="border rounded-lg border-dashed p-3">
          <p className="text-sm text-muted-foreground mb-2">
            {unclassified.length} comentarios sin clasificar
          </p>
        </div>
      )}
    </div>
  )
}
