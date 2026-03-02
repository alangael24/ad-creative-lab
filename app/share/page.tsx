'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, User, Building2, FolderOpen, Check, ExternalLink } from 'lucide-react'

interface Avatar {
  id: string
  name: string
  description: string | null
  _count?: { nativeContent: number }
}

interface Competitor {
  id: string
  name: string
  description: string | null
  _count?: { ads: number }
}

type DestinationType = 'avatar' | 'competitor' | 'swipefile'

export default function SharePage() {
  return (
    <Suspense fallback={<SharePageLoading />}>
      <SharePageContent />
    </Suspense>
  )
}

function SharePageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}

function SharePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [sharedUrl, setSharedUrl] = useState<string | null>(null)
  const [sharedText, setSharedText] = useState<string | null>(null)
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedType, setSelectedType] = useState<DestinationType | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Extract shared content from URL params
  useEffect(() => {
    const url = searchParams.get('url')
    const text = searchParams.get('text')
    const title = searchParams.get('title')

    // TikTok shares the URL in different params depending on the device
    const extractedUrl = url || extractUrlFromText(text) || extractUrlFromText(title)

    setSharedUrl(extractedUrl)
    setSharedText(text || title)
  }, [searchParams])

  // Load avatars and competitors
  useEffect(() => {
    async function loadData() {
      try {
        const [avatarsRes, competitorsRes] = await Promise.all([
          fetch('/api/avatars'),
          fetch('/api/competitors')
        ])

        if (avatarsRes.ok) {
          const data = await avatarsRes.json()
          setAvatars(data)
        }

        if (competitorsRes.ok) {
          const data = await competitorsRes.json()
          setCompetitors(data)
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  function extractUrlFromText(text: string | null): string | null {
    if (!text) return null
    // Match TikTok URLs
    const urlMatch = text.match(/(https?:\/\/[^\s]+tiktok[^\s]+)/i)
    if (urlMatch) return urlMatch[1]
    // Match any URL
    const anyUrlMatch = text.match(/(https?:\/\/[^\s]+)/i)
    return anyUrlMatch ? anyUrlMatch[1] : null
  }

  function detectPlatform(url: string): string {
    if (url.includes('tiktok.com')) return 'tiktok'
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
    if (url.includes('instagram.com')) return 'instagram'
    return 'other'
  }

  async function handleSave() {
    if (!sharedUrl || !selectedType) return

    setSaving(true)
    setError(null)

    try {
      const platform = detectPlatform(sharedUrl)

      if (selectedType === 'avatar' && selectedId) {
        // Save to avatar's native content
        const res = await fetch(`/api/avatars/${selectedId}/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceUrl: sharedUrl,
            platform,
            mediaUrl: sharedUrl, // Will be the embed URL
            mediaType: 'video',
          })
        })

        if (!res.ok) throw new Error('Error al guardar')

      } else if (selectedType === 'competitor' && selectedId) {
        // Save to competitor's ads
        const res = await fetch(`/api/competitors/${selectedId}/ads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceUrl: sharedUrl,
            platform,
            mediaUrl: sharedUrl,
            mediaType: 'video',
          })
        })

        if (!res.ok) throw new Error('Error al guardar')

      } else if (selectedType === 'swipefile') {
        // Save to general swipe file (first competitor or create a general one)
        let targetCompetitorId = competitors[0]?.id

        if (!targetCompetitorId) {
          // Create a "General" competitor for swipe file
          const res = await fetch('/api/competitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Swipe File General',
              description: 'Colección general de referencias'
            })
          })

          if (res.ok) {
            const newCompetitor = await res.json()
            targetCompetitorId = newCompetitor.id
          }
        }

        if (targetCompetitorId) {
          const res = await fetch(`/api/competitors/${targetCompetitorId}/ads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceUrl: sharedUrl,
              platform,
              mediaUrl: sharedUrl,
              mediaType: 'video',
            })
          })

          if (!res.ok) throw new Error('Error al guardar')
        }
      }

      setSaved(true)

      // Redirect after 1.5 seconds
      setTimeout(() => {
        if (selectedType === 'avatar' && selectedId) {
          router.push(`/avatars/${selectedId}`)
        } else if (selectedType === 'competitor' && selectedId) {
          router.push(`/competitors/${selectedId}`)
        } else {
          router.push('/competitors')
        }
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Guardado</h1>
          <p className="text-muted-foreground">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold mb-2">Guardar Video</h1>
          {sharedUrl ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <span className="truncate max-w-[250px]">{sharedUrl}</span>
            </div>
          ) : (
            <p className="text-muted-foreground">No se detectó ningún enlace</p>
          )}
        </div>

        {sharedUrl && (
          <>
            {/* Destination Type Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Elige el destino:</p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => { setSelectedType('avatar'); setSelectedId(null); }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedType === 'avatar'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <User className={`h-6 w-6 mx-auto mb-2 ${selectedType === 'avatar' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Avatar</span>
                </button>

                <button
                  onClick={() => { setSelectedType('competitor'); setSelectedId(null); }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedType === 'competitor'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Building2 className={`h-6 w-6 mx-auto mb-2 ${selectedType === 'competitor' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Competidor</span>
                </button>

                <button
                  onClick={() => { setSelectedType('swipefile'); setSelectedId('general'); }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedType === 'swipefile'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <FolderOpen className={`h-6 w-6 mx-auto mb-2 ${selectedType === 'swipefile' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">Swipe File</span>
                </button>
              </div>
            </div>

            {/* Avatar Selection */}
            {selectedType === 'avatar' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Selecciona el avatar:</p>

                {avatars.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      No hay avatares creados
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setSelectedId(avatar.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedId === avatar.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{avatar.name}</p>
                            {avatar.description && (
                              <p className="text-sm text-muted-foreground truncate">{avatar.description}</p>
                            )}
                          </div>
                          {selectedId === avatar.id && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Competitor Selection */}
            {selectedType === 'competitor' && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Selecciona el competidor:</p>

                {competitors.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      No hay competidores creados
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {competitors.map((competitor) => (
                      <button
                        key={competitor.id}
                        onClick={() => setSelectedId(competitor.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedId === competitor.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{competitor.name}</p>
                            {competitor.description && (
                              <p className="text-sm text-muted-foreground truncate">{competitor.description}</p>
                            )}
                          </div>
                          {selectedId === competitor.id && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Swipe File Info */}
            {selectedType === 'swipefile' && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Swipe File General</p>
                      <p className="text-sm text-muted-foreground">
                        Se guardará en tu colección general de referencias
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!selectedType || (selectedType !== 'swipefile' && !selectedId) || saving}
              className="w-full h-12 text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar Video'
              )}
            </Button>
          </>
        )}

        {/* No URL detected */}
        {!sharedUrl && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                No se pudo detectar un enlace de video. Intenta compartir de nuevo desde TikTok.
              </p>
              <Button variant="outline" onClick={() => router.push('/')}>
                Ir al inicio
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
