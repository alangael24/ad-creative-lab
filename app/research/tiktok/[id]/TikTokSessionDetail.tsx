'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TikTokCommentCard } from '@/components/research/tiktok/TikTokCommentCard'
import { TikTokVideoCard } from '@/components/research/tiktok/TikTokVideoCard'
import { TikTokClassifiedView } from '@/components/research/tiktok/TikTokClassifiedView'
import {
  Chrome,
  ArrowLeft,
  MessageSquare,
  Video,
  Brain,
  Loader2,
  CheckCircle,
  ExternalLink,
  Bookmark,
  Layers,
  Play,
  Wifi,
} from 'lucide-react'
import Link from 'next/link'

interface Comment {
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
  videoUrl: string | null
  createdAt: string
}

interface VideoData {
  id: string
  videoUrl: string
  description: string | null
  hashtags: string | null
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
  createdAt: string
}

interface Avatar {
  id: string
  name: string
  painPoints: string
  desires: string
}

interface SessionData {
  id: string
  status: string
  scanType: string
  sourceUrl: string
  query: string | null
  totalItems: number
  summary: string | null
  avatar: Avatar | null
  comments: Comment[]
  videos: VideoData[]
  createdAt: string
  updatedAt: string
}

interface TikTokSessionDetailProps {
  session: SessionData
}

type TabView = 'all' | 'comments' | 'videos' | 'classified'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
  scanning: { label: 'Escaneando', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  classifying: { label: 'Clasificando', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  completed: { label: 'Completado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  failed: { label: 'Error', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
}

export function TikTokSessionDetail({ session: initialSession }: TikTokSessionDetailProps) {
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [activeTab, setActiveTab] = useState<TabView>(
    session.comments.length > 0 ? 'comments' : 'videos'
  )
  const [isClassifying, setIsClassifying] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkSaving, setIsBulkSaving] = useState(false)

  // Automated scan state
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState<{ phase: string; message: string; count?: number } | null>(null)

  const hasUnclassified = session.comments.some((c) => !c.category)
  const classifiedCount = session.comments.filter((c) => c.category).length
  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending

  const handleStartScan = useCallback(async () => {
    setIsScanning(true)
    setScanProgress({ phase: 'init', message: 'Iniciando scan automatico...' })

    try {
      const res = await fetch(`/api/tiktok/session/${session.id}/scan`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Error al iniciar scan')
      if (!res.body) throw new Error('No stream body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.substring(7).trim()
          } else if (line.startsWith('data: ') && eventType) {
            try {
              const data = JSON.parse(line.substring(6))

              if (eventType === 'progress') {
                setScanProgress(data)
              } else if (eventType === 'complete') {
                setScanProgress({
                  phase: 'complete',
                  message: `Completado! ${data.comments || 0} comentarios, ${data.videos || 0} videos`,
                  count: data.total,
                })
                // Refresh page data
                router.refresh()
              } else if (eventType === 'error') {
                setScanProgress({
                  phase: 'error',
                  message: data.message || 'Error durante el scan',
                })
              }
            } catch { /* malformed JSON */ }
            eventType = ''
          }
        }
      }
    } catch (error) {
      setScanProgress({
        phase: 'error',
        message: error instanceof Error ? error.message : 'Error al conectar con el scanner',
      })
    } finally {
      setIsScanning(false)
      // Reload session data
      setTimeout(() => router.refresh(), 1000)
    }
  }, [session.id, router])

  const handleClassify = async () => {
    setIsClassifying(true)
    try {
      const res = await fetch(`/api/tiktok/session/${session.id}/classify`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Error al clasificar')
      const data = await res.json()

      // Update local state with classified comments
      if (data.comments) {
        setSession((prev) => ({
          ...prev,
          status: 'completed',
          comments: data.comments.map((c: Comment & { createdAt: string }) => ({
            ...c,
            createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date(c.createdAt).toISOString(),
          })),
        }))
        setActiveTab('classified')
      }
    } catch (error) {
      console.error('Classification error:', error)
    } finally {
      setIsClassifying(false)
    }
  }

  const handleSaveComment = async (commentId: string) => {
    const res = await fetch(`/api/tiktok/comment/${commentId}/save`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Error al guardar')
    // Update local state
    setSession((prev) => ({
      ...prev,
      comments: prev.comments.map((c) =>
        c.id === commentId ? { ...c, savedToResearch: true } : c
      ),
    }))
  }

  const handleSaveVideo = async (videoId: string) => {
    const res = await fetch(`/api/tiktok/video/${videoId}/save`, {
      method: 'POST',
    })
    if (!res.ok) throw new Error('Error al guardar')
    setSession((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId ? { ...v, savedToResearch: true } : v
      ),
    }))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBulkSave = async () => {
    setIsBulkSaving(true)
    try {
      const promises = Array.from(selectedIds).map((id) => {
        // Check if it's a comment or video
        const isComment = session.comments.some((c) => c.id === id)
        if (isComment) {
          return handleSaveComment(id)
        } else {
          return handleSaveVideo(id)
        }
      })
      await Promise.all(promises)
      setSelectedIds(new Set())
    } catch (error) {
      console.error('Bulk save error:', error)
    } finally {
      setIsBulkSaving(false)
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/research/tiktok">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Chrome className="h-5 w-5 text-orange-500" />
            <h1 className="text-xl font-bold">
              Scan: {session.scanType === 'comments' ? 'Comentarios' :
                     session.scanType === 'search' ? 'Busqueda' :
                     session.scanType === 'profile' ? 'Perfil' : 'Feed'}
            </h1>
            <Badge className={`${statusConfig.className}`}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {session.avatar && (
              <span>Avatar: <strong>{session.avatar.name}</strong></span>
            )}
            <a
              href={session.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Ver en TikTok
            </a>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-card border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Comentarios</p>
          <p className="text-xl font-bold">{session.comments.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Videos</p>
          <p className="text-xl font-bold">{session.videos.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Clasificados</p>
          <p className="text-xl font-bold">{classifiedCount}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-xs text-red-600 dark:text-red-400">Pain Points</p>
          <p className="text-xl font-bold text-red-700 dark:text-red-300">
            {session.comments.filter((c) => c.category === 'pain_point').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-xs text-green-600 dark:text-green-400">Deseos</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-300">
            {session.comments.filter((c) => c.category === 'desire').length}
          </p>
        </div>
      </div>

      {/* Scan progress */}
      {(isScanning || scanProgress) && (
        <div className={`mb-4 border rounded-lg p-4 ${
          scanProgress?.phase === 'error'
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            : scanProgress?.phase === 'complete'
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
            : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-center gap-3">
            {isScanning ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
            ) : scanProgress?.phase === 'complete' ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : scanProgress?.phase === 'error' ? (
              <Chrome className="h-5 w-5 text-red-600 dark:text-red-400" />
            ) : null}
            <div>
              <p className="text-sm font-medium">{scanProgress?.message}</p>
              {scanProgress?.count !== undefined && scanProgress.count > 0 && (
                <p className="text-xs text-muted-foreground">{scanProgress.count} items</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Auto scan button */}
        {(session.status === 'pending' || session.status === 'failed') && !isScanning && (
          <Button
            onClick={handleStartScan}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Scan Automatico
          </Button>
        )}

        {/* Classify button */}
        {session.comments.length > 0 && hasUnclassified && (
          <Button
            onClick={handleClassify}
            disabled={isClassifying}
            variant="outline"
            className="border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            {isClassifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clasificando {session.comments.filter((c) => !c.category).length} comentarios...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Clasificar con IA ({session.comments.filter((c) => !c.category).length} sin clasificar)
              </>
            )}
          </Button>
        )}

        {/* Bulk save */}
        {selectedIds.size > 0 && (
          <Button
            onClick={handleBulkSave}
            disabled={isBulkSaving}
          >
            {isBulkSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bookmark className="h-4 w-4 mr-2" />
            )}
            Guardar seleccionados ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b mb-4">
        {session.comments.length > 0 && (
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'comments'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
            Comentarios ({session.comments.length})
          </button>
        )}
        {session.videos.length > 0 && (
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'videos'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Video className="h-3.5 w-3.5 inline mr-1.5" />
            Videos ({session.videos.length})
          </button>
        )}
        {classifiedCount > 0 && (
          <button
            onClick={() => setActiveTab('classified')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'classified'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="h-3.5 w-3.5 inline mr-1.5" />
            Clasificados ({classifiedCount})
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'comments' && (
        <div className="space-y-2">
          {session.comments.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay comentarios extraidos aun</p>
              <p className="text-sm text-muted-foreground mt-1">
                Usa Claude in Chrome para navegar a TikTok y extraer comentarios
              </p>
            </div>
          ) : (
            session.comments.map((comment) => (
              <TikTokCommentCard
                key={comment.id}
                comment={comment}
                selected={selectedIds.has(comment.id)}
                onToggleSelect={toggleSelect}
                onSave={handleSaveComment}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'videos' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {session.videos.length === 0 ? (
            <div className="col-span-full text-center py-12 border rounded-lg border-dashed">
              <Video className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay videos extraidos aun</p>
            </div>
          ) : (
            session.videos.map((video) => (
              <TikTokVideoCard
                key={video.id}
                video={video}
                selected={selectedIds.has(video.id)}
                onToggleSelect={toggleSelect}
                onSave={handleSaveVideo}
              />
            ))
          )}
        </div>
      )}

      {activeTab === 'classified' && (
        <TikTokClassifiedView
          comments={session.comments.filter((c) => c.category)}
          onSave={handleSaveComment}
        />
      )}
    </>
  )
}
