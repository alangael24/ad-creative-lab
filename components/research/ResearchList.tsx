"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RESEARCH_SOURCES, RESEARCH_CATEGORIES } from '@/lib/constants'
import { Plus, Loader2, ExternalLink, Trash2 } from 'lucide-react'

interface ResearchItem {
  id: string
  source: string
  url: string | null
  content: string
  category: string
  context: string | null
  tags: string | null
  createdAt: Date | string
}

interface ResearchListProps {
  avatarId: string
  avatarName: string
  items: ResearchItem[]
}

export function ResearchList({ avatarId, avatarName, items: initialItems }: ResearchListProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [isAdding, setIsAdding] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [filter, setFilter] = useState('')

  const [newItem, setNewItem] = useState({
    source: 'reddit',
    url: '',
    content: '',
    category: 'pain_point',
    context: '',
  })

  const handleAdd = async () => {
    if (!newItem.content.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newItem,
          avatarId,
        }),
      })

      if (response.ok) {
        const item = await response.json()
        setItems([item, ...items])
        setNewItem({
          source: 'reddit',
          url: '',
          content: '',
          category: 'pain_point',
          context: '',
        })
        setIsAdding(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding research item:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este item de research?')) return

    try {
      const response = await fetch(`/api/research/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setItems(items.filter(item => item.id !== id))
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting research item:', error)
    }
  }

  const filteredItems = filter
    ? items.filter(item => item.category === filter)
    : items

  const getCategoryConfig = (category: string) =>
    RESEARCH_CATEGORIES.find(c => c.value === category)

  const getSourceConfig = (source: string) =>
    RESEARCH_SOURCES.find(s => s.value === source)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Research para {avatarName}</h2>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar Hallazgo
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === '' ? 'default' : 'outline'}
          onClick={() => setFilter('')}
        >
          Todos ({items.length})
        </Button>
        {RESEARCH_CATEGORIES.map(cat => {
          const count = items.filter(i => i.category === cat.value).length
          return (
            <Button
              key={cat.value}
              size="sm"
              variant={filter === cat.value ? 'default' : 'outline'}
              onClick={() => setFilter(cat.value)}
              className={filter === cat.value ? cat.color : ''}
            >
              {cat.icon} {cat.label} ({count})
            </Button>
          )
        })}
      </div>

      {/* Add New Item Form */}
      {isAdding && (
        <Card className="border-2 border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nuevo Hallazgo de Research</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fuente*</Label>
                <select
                  value={newItem.source}
                  onChange={(e) => setNewItem({ ...newItem, source: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {RESEARCH_SOURCES.map(source => (
                    <option key={source.value} value={source.value}>
                      {source.icon} {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Categoría*</Label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {RESEARCH_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quote/Hallazgo*</Label>
              <Textarea
                placeholder="Copia el texto exacto que encontraste. Ej: 'Me despierto a las 3am por sudores fríos y mi esposo ni se entera'"
                value={newItem.content}
                onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>URL (opcional)</Label>
              <Input
                type="url"
                placeholder="https://reddit.com/..."
                value={newItem.url}
                onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Contexto (opcional)</Label>
              <Input
                placeholder="¿Dónde/cómo lo encontraste?"
                value={newItem.context}
                onChange={(e) => setNewItem({ ...newItem, context: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!newItem.content.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">
              {items.length === 0
                ? 'No hay research todavía. Agrega tu primer hallazgo.'
                : 'No hay items en esta categoría.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const categoryConfig = getCategoryConfig(item.category)
            const sourceConfig = getSourceConfig(item.source)

            return (
              <Card key={item.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={categoryConfig?.color}>
                          {categoryConfig?.icon} {categoryConfig?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {sourceConfig?.icon} {sourceConfig?.label}
                        </span>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver fuente
                          </a>
                        )}
                      </div>

                      <p className="text-sm">&quot;{item.content}&quot;</p>

                      {item.context && (
                        <p className="text-xs text-muted-foreground">
                          Contexto: {item.context}
                        </p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
