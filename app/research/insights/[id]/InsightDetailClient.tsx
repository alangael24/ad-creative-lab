'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, X, Plus, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { InsightEditor } from '@/components/research/InsightEditor'
import { InsightExtractor } from '@/components/research/InsightExtractor'

interface LinkedAvatar {
  avatar: {
    id: string
    name: string
  }
}

interface Insight {
  id: string
  title: string
  content: string
  avatars: LinkedAvatar[]
  createdAt: string
  updatedAt: string
}

interface InsightDetailClientProps {
  insight: Insight
  allAvatars: { id: string; name: string }[]
}

export function InsightDetailClient({ insight: initialInsight, allAvatars }: InsightDetailClientProps) {
  const [insight, setInsight] = useState(initialInsight)
  const [title, setTitle] = useState(insight.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  const linkedAvatarIds = insight.avatars.map(a => a.avatar.id)
  const availableAvatars = allAvatars.filter(a => !linkedAvatarIds.includes(a.id))

  const handleSaveContent = async (content: string) => {
    await fetch(`/api/insights/${insight.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  const handleSaveTitle = async () => {
    if (title.trim() === '') return
    await fetch(`/api/insights/${insight.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setIsEditingTitle(false)
  }

  const handleLinkAvatar = async (avatarId: string) => {
    try {
      const res = await fetch(`/api/insights/${insight.id}/avatars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarId }),
      })
      const link = await res.json()
      setInsight({
        ...insight,
        avatars: [...insight.avatars, { avatar: link.avatar }],
      })
      setShowAvatarSelector(false)
    } catch (error) {
      console.error('Error linking avatar:', error)
    }
  }

  const handleUnlinkAvatar = async (avatarId: string) => {
    try {
      await fetch(`/api/insights/${insight.id}/avatars?avatarId=${avatarId}`, {
        method: 'DELETE',
      })
      setInsight({
        ...insight,
        avatars: insight.avatars.filter(a => a.avatar.id !== avatarId),
      })
    } catch (error) {
      console.error('Error unlinking avatar:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/research/insights">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Title */}
      <div className="mb-6">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold h-auto py-1"
              autoFocus
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            />
          </div>
        ) : (
          <h1
            className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
            onClick={() => setIsEditingTitle(true)}
          >
            {title}
          </h1>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Haz clic en el título para editarlo
        </p>
      </div>

      {/* Linked Avatars */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Avatars vinculados</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {insight.avatars.map((link) => (
            <Badge key={link.avatar.id} variant="secondary" className="pl-3 pr-1 py-1">
              <Link href={`/research/avatars/${link.avatar.id}`} className="hover:underline">
                {link.avatar.name}
              </Link>
              <button
                onClick={() => handleUnlinkAvatar(link.avatar.id)}
                className="ml-2 hover:bg-muted rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {showAvatarSelector ? (
            <div className="flex items-center gap-2">
              <select
                className="text-sm border rounded px-2 py-1 bg-background"
                onChange={(e) => e.target.value && handleLinkAvatar(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>Seleccionar avatar...</option>
                {availableAvatars.map((avatar) => (
                  <option key={avatar.id} value={avatar.id}>
                    {avatar.name}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAvatarSelector(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAvatarSelector(true)}
              disabled={availableAvatars.length === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Vincular avatar
            </Button>
          )}
        </div>
        {availableAvatars.length === 0 && insight.avatars.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            No hay avatars creados. <Link href="/research/avatars/new" className="underline">Crea uno</Link> para poder vincularlo.
          </p>
        )}
      </div>

      {/* Editor */}
      <InsightEditor
        initialContent={insight.content}
        onSave={handleSaveContent}
        autoSave
      />

      {/* Success message */}
      {savedMessage && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700 dark:text-green-300">{savedMessage}</span>
          <button
            onClick={() => setSavedMessage(null)}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* AI Extractor */}
      <InsightExtractor
        insightId={insight.id}
        onSave={(items) => {
          setSavedMessage(`${items.length} elementos guardados como borradores de research`)
          setTimeout(() => setSavedMessage(null), 5000)
        }}
      />
    </div>
  )
}
