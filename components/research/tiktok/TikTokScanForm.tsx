'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Chrome,
  Loader2,
  User,
  Target,
  Sparkles,
  X,
  Link2,
  MessageSquare,
  Search,
  UserCircle,
  ListVideo,
} from 'lucide-react'

interface Avatar {
  id: string
  name: string
  description: string | null
  painPoints: string
  desires: string
}

interface TikTokScanFormProps {
  avatars: Avatar[]
  onClose: () => void
}

const SCAN_TYPES = [
  {
    value: 'comments',
    label: 'Comentarios',
    icon: MessageSquare,
    description: 'Extrae comentarios de un video especifico',
  },
  {
    value: 'search',
    label: 'Busqueda',
    icon: Search,
    description: 'Escanea resultados de busqueda en TikTok',
  },
  {
    value: 'profile',
    label: 'Perfil',
    icon: UserCircle,
    description: 'Analiza un perfil de creador y sus videos',
  },
  {
    value: 'feed',
    label: 'Feed',
    icon: ListVideo,
    description: 'Captura videos del feed o hashtag',
  },
]

export function TikTokScanForm({ avatars, onClose }: TikTokScanFormProps) {
  const router = useRouter()
  const [selectedAvatarId, setSelectedAvatarId] = useState('')
  const [scanType, setScanType] = useState('comments')
  const [sourceUrl, setSourceUrl] = useState('')
  const [query, setQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId)

  let painPoints: string[] = []
  let desires: string[] = []
  if (selectedAvatar) {
    try { painPoints = JSON.parse(selectedAvatar.painPoints) } catch { /* */ }
    try { desires = JSON.parse(selectedAvatar.desires) } catch { /* */ }
  }

  const needsUrl = scanType === 'comments' || scanType === 'profile'
  const needsQuery = scanType === 'search' || scanType === 'feed'

  const handleSubmit = async () => {
    if (needsUrl && !sourceUrl.trim()) {
      setError('Ingresa una URL de TikTok')
      return
    }
    if (needsQuery && !query.trim()) {
      setError('Ingresa un termino de busqueda')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const body: Record<string, string | undefined> = {
        avatarId: selectedAvatarId || undefined,
        scanType,
        sourceUrl: sourceUrl.trim() || (needsQuery ? `https://www.tiktok.com/search?q=${encodeURIComponent(query.trim())}` : ''),
        query: query.trim() || undefined,
      }

      const res = await fetch('/api/tiktok/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al crear sesion')
      }

      const session = await res.json()
      router.push(`/research/tiktok/${session.id}`)
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
            <Chrome className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Nuevo Scan de TikTok</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Scan type selector */}
          <div className="space-y-2">
            <Label>Tipo de scan</Label>
            <div className="grid grid-cols-2 gap-2">
              {SCAN_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setScanType(type.value)}
                    className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                      scanType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 ${scanType === type.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* URL input */}
          {needsUrl && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                URL de TikTok *
              </Label>
              <input
                type="url"
                placeholder="https://www.tiktok.com/@user/video/123..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {scanType === 'comments'
                  ? 'Pega la URL de un video de TikTok para extraer sus comentarios'
                  : 'Pega la URL del perfil del creador'}
              </p>
            </div>
          )}

          {/* Search query */}
          {needsQuery && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Busqueda *
              </Label>
              <input
                type="text"
                placeholder="Ej: skincare routine acne, dolor de espalda remedios..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>
          )}

          {/* Avatar selector (optional) */}
          <div className="space-y-2">
            <Label>Avatar (opcional)</Label>
            <select
              value={selectedAvatarId}
              onChange={(e) => setSelectedAvatarId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Sin avatar (scan libre)</option>
              {avatars.map((avatar) => (
                <option key={avatar.id} value={avatar.id}>
                  {avatar.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Vincular a un avatar permite clasificar los resultados segun sus pain points y deseos
            </p>
          </div>

          {/* Avatar preview */}
          {selectedAvatar && (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedAvatar.name}</span>
              </div>
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
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Info box */}
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-xs text-orange-700 dark:text-orange-300">
              <strong>Chrome Extension requerida:</strong> Este scan usa Claude in Chrome para leer el DOM de TikTok directamente. Asegurate de tener la extension conectada y la pagina de TikTok abierta.
            </p>
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
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Chrome className="h-4 w-4 mr-2" />
                Crear Sesion de Scan
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
