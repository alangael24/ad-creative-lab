'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScoutFindingGrid } from '@/components/research/scout/ScoutFindingGrid'
import {
  Radar,
  ArrowLeft,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Play,
  Clock,
} from 'lucide-react'

interface ScoutFinding {
  id: string
  type: string
  content: string
  sourceUrl: string | null
  creator: string | null
  engagement: string | null
  relevance: string
  relevanceReason: string
  category: string
  thumbnailUrl: string | null
  savedToResearch: boolean
  createdAt: string
}

interface Session {
  id: string
  status: string
  query: string
  context: string | null
  totalFindings: number
  avatarId: string
  avatarName: string
  createdAt: string
  updatedAt: string
  findings: ScoutFinding[]
}

interface ScoutSessionDetailProps {
  session: Session
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Loader2; className: string }> = {
  running: {
    label: 'En progreso',
    icon: Loader2,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  completed: {
    label: 'Completada',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  failed: {
    label: 'Fallida',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
}

export function ScoutSessionDetail({ session: initialSession }: ScoutSessionDetailProps) {
  const [session, setSession] = useState(initialSession)
  const [progressMessage, setProgressMessage] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.running
  const StatusIcon = statusConfig.icon

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Start the scout agent via SSE
  const startScout = useCallback(async () => {
    setIsRunning(true)
    setProgressMessage('Conectando con el agente...')

    try {
      const response = await fetch(`/api/scout/session/${session.id}/run`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al iniciar el scout')
      }

      if (!response.body) {
        throw new Error('No se recibió stream de respuesta')
      }

      // Read SSE stream
      const reader = response.body.getReader()
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
            eventType = line.slice(7)
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (eventType === 'progress' || eventType === 'status') {
                setProgressMessage(data.message || '')
              } else if (eventType === 'complete') {
                setProgressMessage('')
                // Refresh session data to get findings
                const res = await fetch(`/api/scout/session/${session.id}`)
                if (res.ok) {
                  const updatedSession = await res.json()
                  setSession({
                    ...session,
                    status: 'completed',
                    totalFindings: updatedSession.findings?.length || data.totalFindings || 0,
                    findings: (updatedSession.findings || []).map((f: Record<string, unknown>) => ({
                      ...f,
                      createdAt: typeof f.createdAt === 'string' ? f.createdAt : new Date(f.createdAt as string).toISOString(),
                    })),
                  })
                }
              } else if (eventType === 'error') {
                setProgressMessage(`Error: ${data.message}`)
                setSession(prev => ({ ...prev, status: 'failed' }))
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      setProgressMessage(error instanceof Error ? error.message : 'Error desconocido')
      setSession(prev => ({ ...prev, status: 'failed' }))
    } finally {
      setIsRunning(false)
    }
  }, [session.id])

  // Auto-start if session is in 'running' state with no findings
  useEffect(() => {
    if (session.status === 'running' && session.findings.length === 0 && !isRunning) {
      startScout()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveFinding = async (findingId: string) => {
    const res = await fetch(`/api/scout/finding/${findingId}/save`, {
      method: 'POST',
    })
    if (!res.ok) {
      throw new Error('Error al guardar')
    }
    setSession((prev) => ({
      ...prev,
      findings: prev.findings.map((f) =>
        f.id === findingId ? { ...f, savedToResearch: true } : f
      ),
    }))
  }

  const handleSaveMultiple = async (findingIds: string[]) => {
    // Save one by one since we don't have a bulk endpoint
    for (const id of findingIds) {
      await fetch(`/api/scout/finding/${id}/save`, { method: 'POST' })
    }
    setSession((prev) => ({
      ...prev,
      findings: prev.findings.map((f) =>
        findingIds.includes(f.id) ? { ...f, savedToResearch: true } : f
      ),
    }))
  }

  return (
    <div>
      {/* Back navigation */}
      <Link
        href="/research/scout"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Scout
      </Link>

      {/* Session header */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Radar className="h-6 w-6 text-cyan-500 mt-0.5" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">Mision Scout</h1>
                <Badge className={`text-xs ${statusConfig.className}`}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${session.status === 'running' ? 'animate-spin' : ''}`} />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm mb-2">&ldquo;{session.query}&rdquo;</p>
              {session.context && (
                <p className="text-xs text-muted-foreground italic mb-2">
                  Contexto: {session.context}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Link
                  href={`/research/avatars/${session.avatarId}`}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  {session.avatarName}
                </Link>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(session.createdAt)}
                </span>
                <span>{session.findings.length} hallazgos</span>
              </div>
            </div>
          </div>

          {/* Re-run button for failed sessions */}
          {session.status === 'failed' && !isRunning && (
            <Button variant="outline" size="sm" onClick={startScout}>
              <Play className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          )}
        </div>

        {/* Progress indicator */}
        {(isRunning || session.status === 'running') && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{progressMessage || 'El agente esta investigando TikTok...'}</span>
            </div>
            <div className="mt-2 h-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>

      {/* Findings grid */}
      {session.findings.length > 0 ? (
        <ScoutFindingGrid
          findings={session.findings}
          onSaveFinding={handleSaveFinding}
          onSaveMultiple={handleSaveMultiple}
        />
      ) : session.status === 'completed' ? (
        <div className="text-center py-12 text-muted-foreground">
          <Radar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No se encontraron hallazgos en esta mision</p>
        </div>
      ) : null}
    </div>
  )
}
