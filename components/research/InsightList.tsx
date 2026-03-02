'use client'

import Link from 'next/link'
import { FileText, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

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

interface InsightListProps {
  insights: Insight[]
}

export function InsightList({ insights: initialInsights }: InsightListProps) {
  const router = useRouter()
  const [insights, setInsights] = useState(initialInsights)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nuevo Insight' }),
      })
      const insight = await res.json()
      router.push(`/research/insights/${insight.id}`)
    } catch (error) {
      console.error('Error creating insight:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('¿Eliminar este insight?')) return

    try {
      await fetch(`/api/insights/${id}`, { method: 'DELETE' })
      setInsights(insights.filter(i => i.id !== id))
    } catch (error) {
      console.error('Error deleting insight:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getPreview = (content: string) => {
    if (!content) return 'Sin contenido'
    try {
      const parsed = JSON.parse(content)
      const text = extractText(parsed)
      return text.slice(0, 120) + (text.length > 120 ? '...' : '')
    } catch {
      return 'Sin contenido'
    }
  }

  const extractText = (node: unknown): string => {
    if (typeof node === 'string') return node
    if (node && typeof node === 'object') {
      const n = node as { text?: string; content?: unknown[] }
      if (n.text) return n.text
      if (n.content) {
        return n.content.map(extractText).join(' ')
      }
    }
    return ''
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Insights</h1>
          <p className="text-muted-foreground mt-1">
            Tu lienzo para capturar patrones y observaciones
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Insight
        </Button>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay insights todavía</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primer documento para empezar a capturar patrones
          </p>
          <Button onClick={handleCreate} disabled={isCreating}>
            <Plus className="h-4 w-4 mr-2" />
            Crear primer insight
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => (
            <Link
              key={insight.id}
              href={`/research/insights/${insight.id}`}
              className="group bg-card border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <h3 className="font-medium truncate">{insight.title}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => handleDelete(insight.id, e)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {getPreview(insight.content)}
              </p>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1 flex-wrap">
                  {insight.avatars.length > 0 ? (
                    insight.avatars.slice(0, 2).map((link) => (
                      <Badge key={link.avatar.id} variant="secondary" className="text-xs">
                        {link.avatar.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Sin vincular
                    </span>
                  )}
                  {insight.avatars.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{insight.avatars.length - 2}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(insight.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
