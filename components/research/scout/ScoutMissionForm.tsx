'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Radar,
  Loader2,
  User,
  Target,
  Sparkles,
  X,
} from 'lucide-react'

interface Avatar {
  id: string
  name: string
  description: string | null
  painPoints: string
  desires: string
}

interface ScoutMissionFormProps {
  avatars: Avatar[]
  onClose: () => void
}

export function ScoutMissionForm({ avatars, onClose }: ScoutMissionFormProps) {
  const router = useRouter()
  const [selectedAvatarId, setSelectedAvatarId] = useState('')
  const [customQuery, setCustomQuery] = useState('')
  const [context, setContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId)

  let painPoints: string[] = []
  let desires: string[] = []
  if (selectedAvatar) {
    try { painPoints = JSON.parse(selectedAvatar.painPoints) } catch { /* ignore */ }
    try { desires = JSON.parse(selectedAvatar.desires) } catch { /* ignore */ }
  }

  const handleSubmit = async () => {
    if (!selectedAvatarId) {
      setError('Selecciona un avatar para la mision')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/scout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarId: selectedAvatarId,
          query: customQuery.trim() || undefined,
          context: context.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al iniciar mision')
      }

      const session = await res.json()
      router.push(`/research/scout/${session.id}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-cyan-500" />
            <h2 className="text-lg font-semibold">Nueva Mision Scout</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Avatar selector */}
          <div className="space-y-2">
            <Label>Avatar *</Label>
            <select
              value={selectedAvatarId}
              onChange={(e) => setSelectedAvatarId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Seleccionar avatar...</option>
              {avatars.map((avatar) => (
                <option key={avatar.id} value={avatar.id}>
                  {avatar.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              El Scout analizara TikTok basandose en el perfil de este avatar
            </p>
          </div>

          {/* Avatar preview */}
          {selectedAvatar && (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedAvatar.name}</span>
              </div>
              {selectedAvatar.description && (
                <p className="text-xs text-muted-foreground">{selectedAvatar.description}</p>
              )}
              {painPoints.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1 mb-1">
                    <Target className="h-3 w-3" />
                    Pain Points
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {painPoints.slice(0, 3).map((p, i) => (
                      <li key={i} className="line-clamp-1">- {p}</li>
                    ))}
                    {painPoints.length > 3 && (
                      <li className="text-xs text-muted-foreground">+{painPoints.length - 3} mas...</li>
                    )}
                  </ul>
                </div>
              )}
              {desires.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3" />
                    Deseos
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    {desires.slice(0, 3).map((d, i) => (
                      <li key={i} className="line-clamp-1">- {d}</li>
                    ))}
                    {desires.length > 3 && (
                      <li className="text-xs text-muted-foreground">+{desires.length - 3} mas...</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Custom query */}
          <div className="space-y-2">
            <Label>Busqueda personalizada (opcional)</Label>
            <Textarea
              placeholder="Ej: buscar videos sobre rutinas de skincare para pieles grasas..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Si no se especifica, el Scout generara busquedas basadas en el avatar
            </p>
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label>Contexto adicional (opcional)</Label>
            <Textarea
              placeholder="Ej: enfocate en comentarios con quejas, busca creadores con menos de 100K seguidores..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedAvatarId}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              <>
                <Radar className="h-4 w-4 mr-2" />
                Iniciar Mision
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
