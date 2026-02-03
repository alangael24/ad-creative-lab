"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AWARENESS_LEVELS } from '@/lib/constants'
import {
  Plus, X, Edit2, Trash2, Target, Sparkles, Zap, Ban, Brain,
  ChevronDown, ChevronUp, Loader2, Save
} from 'lucide-react'

interface SubAvatar {
  id: string
  name: string
  painPoint: string
  desire: string
  trigger: string | null
  objection: string | null
  awareness: string
  notes: string | null
  createdAt: string
}

interface SubAvatarManagerProps {
  avatarId: string
  avatarName: string
}

export function SubAvatarManager({ avatarId, avatarName }: SubAvatarManagerProps) {
  const router = useRouter()
  const [subAvatars, setSubAvatars] = useState<SubAvatar[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    painPoint: '',
    desire: '',
    trigger: '',
    objection: '',
    awareness: 'unaware',
    notes: '',
  })

  useEffect(() => {
    fetchSubAvatars()
  }, [avatarId])

  const fetchSubAvatars = async () => {
    try {
      const response = await fetch(`/api/avatars/${avatarId}/sub-avatars`)
      if (response.ok) {
        const data = await response.json()
        setSubAvatars(data)
      }
    } catch (error) {
      console.error('Error fetching sub-avatars:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      painPoint: '',
      desire: '',
      trigger: '',
      objection: '',
      awareness: 'unaware',
      notes: '',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (subAvatar: SubAvatar) => {
    setFormData({
      name: subAvatar.name,
      painPoint: subAvatar.painPoint,
      desire: subAvatar.desire,
      trigger: subAvatar.trigger || '',
      objection: subAvatar.objection || '',
      awareness: subAvatar.awareness,
      notes: subAvatar.notes || '',
    })
    setEditingId(subAvatar.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.painPoint.trim() || !formData.desire.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const url = editingId
        ? `/api/avatars/${avatarId}/sub-avatars/${editingId}`
        : `/api/avatars/${avatarId}/sub-avatars`

      const response = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchSubAvatars()
        resetForm()
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving sub-avatar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este sub-avatar?')) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/avatars/${avatarId}/sub-avatars/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSubAvatars(prev => prev.filter(s => s.id !== id))
        router.refresh()
      }
    } catch (error) {
      console.error('Error deleting sub-avatar:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const getAwarenessConfig = (value: string) =>
    AWARENESS_LEVELS.find(a => a.value === value)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Sub-Avatars
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Clusters de momento/estado para {avatarName}
            </p>
          </div>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form */}
        {showForm && (
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {editingId ? 'Editar Sub-Avatar' : 'Nuevo Sub-Avatar'}
                </h4>
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nombre del momento*</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Después del pediatra, Lunes por la mañana"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="painPoint" className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-red-500" />
                      Pain Point*
                    </Label>
                    <Textarea
                      id="painPoint"
                      placeholder="Me duele X..."
                      value={formData.painPoint}
                      onChange={(e) => setFormData(prev => ({ ...prev, painPoint: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="desire" className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      Deseo*
                    </Label>
                    <Textarea
                      id="desire"
                      placeholder="Quiero Y..."
                      value={formData.desire}
                      onChange={(e) => setFormData(prev => ({ ...prev, desire: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="trigger" className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      Trigger (opcional)
                    </Label>
                    <Input
                      id="trigger"
                      placeholder="Hoy pasó Z..."
                      value={formData.trigger}
                      onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="objection" className="flex items-center gap-1">
                      <Ban className="h-3 w-3 text-orange-500" />
                      Objeción (opcional)
                    </Label>
                    <Input
                      id="objection"
                      placeholder="Ya intenté..."
                      value={formData.objection}
                      onChange={(e) => setFormData(prev => ({ ...prev, objection: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="awareness">Nivel de Conciencia</Label>
                  <Select
                    id="awareness"
                    options={AWARENESS_LEVELS}
                    value={formData.awareness}
                    onChange={(e) => setFormData(prev => ({ ...prev, awareness: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Contexto adicional..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.name.trim() || !formData.painPoint.trim() || !formData.desire.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    {editingId ? 'Guardar' : 'Crear'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sub-Avatar List */}
        {subAvatars.length === 0 && !showForm ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No hay sub-avatars todavía</p>
            <p className="text-sm">
              Crea clusters de momento/estado para guiar tus guiones
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subAvatars.map((subAvatar) => {
              const isExpanded = expandedId === subAvatar.id
              const awarenessConfig = getAwarenessConfig(subAvatar.awareness)

              return (
                <Card
                  key={subAvatar.id}
                  className="border hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <CardContent className="p-3">
                    {/* Header */}
                    <div
                      className="flex items-start justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : subAvatar.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{subAvatar.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {awarenessConfig?.label || subAvatar.awareness}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          <span className="text-red-500">Pain:</span> {subAvatar.painPoint}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(subAvatar)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(subAvatar.id)
                          }}
                          disabled={deletingId === subAvatar.id}
                        >
                          {deletingId === subAvatar.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-2 rounded bg-red-50 dark:bg-red-950/30">
                            <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium mb-1">
                              <Target className="h-3 w-3" />
                              Pain Point
                            </div>
                            <p className="text-sm">{subAvatar.painPoint}</p>
                          </div>

                          <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30">
                            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium mb-1">
                              <Sparkles className="h-3 w-3" />
                              Deseo
                            </div>
                            <p className="text-sm">{subAvatar.desire}</p>
                          </div>
                        </div>

                        {(subAvatar.trigger || subAvatar.objection) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subAvatar.trigger && (
                              <div className="p-2 rounded bg-yellow-50 dark:bg-yellow-950/30">
                                <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">
                                  <Zap className="h-3 w-3" />
                                  Trigger
                                </div>
                                <p className="text-sm">{subAvatar.trigger}</p>
                              </div>
                            )}

                            {subAvatar.objection && (
                              <div className="p-2 rounded bg-orange-50 dark:bg-orange-950/30">
                                <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">
                                  <Ban className="h-3 w-3" />
                                  Objeción
                                </div>
                                <p className="text-sm">{subAvatar.objection}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {subAvatar.notes && (
                          <div className="p-2 rounded bg-muted">
                            <p className="text-xs text-muted-foreground font-medium mb-1">Notas</p>
                            <p className="text-sm">{subAvatar.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
