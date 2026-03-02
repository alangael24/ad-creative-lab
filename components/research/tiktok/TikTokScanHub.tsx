'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Chrome,
  Plus,
  MessageSquare,
  Video,
  Search,
  UserCircle,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { TikTokScanForm } from './TikTokScanForm'
import Link from 'next/link'

interface Avatar {
  id: string
  name: string
  description: string | null
  painPoints: string
  desires: string
}

interface ScanSession {
  id: string
  status: string
  scanType: string
  sourceUrl: string
  query: string | null
  totalItems: number
  avatarName: string | null
  createdAt: string
}

interface TikTokScanHubProps {
  avatars: Avatar[]
  initialSessions: ScanSession[]
}

const SCAN_TYPE_CONFIG: Record<string, { label: string; icon: typeof MessageSquare }> = {
  comments: { label: 'Comentarios', icon: MessageSquare },
  search: { label: 'Busqueda', icon: Search },
  profile: { label: 'Perfil', icon: UserCircle },
  feed: { label: 'Feed', icon: Video },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Pendiente',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  },
  scanning: {
    label: 'Escaneando',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
  classifying: {
    label: 'Clasificando',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  completed: {
    label: 'Completado',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  failed: {
    label: 'Error',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function shortenUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.pathname.substring(0, 40) + (parsed.pathname.length > 40 ? '...' : '')
  } catch {
    return url.substring(0, 40)
  }
}

export function TikTokScanHub({ avatars, initialSessions }: TikTokScanHubProps) {
  const [showForm, setShowForm] = useState(false)
  const [avatarFilter, setAvatarFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  let filtered = initialSessions
  if (avatarFilter) {
    filtered = filtered.filter((s) => s.avatarName === avatarFilter)
  }
  if (typeFilter) {
    filtered = filtered.filter((s) => s.scanType === typeFilter)
  }

  const uniqueAvatarNames = Array.from(new Set(
    initialSessions.map((s) => s.avatarName).filter(Boolean)
  )) as string[]

  const totalComments = initialSessions.reduce((sum, s) =>
    s.scanType === 'comments' ? sum + s.totalItems : sum, 0
  )
  const totalVideos = initialSessions.reduce((sum, s) =>
    s.scanType !== 'comments' ? sum + s.totalItems : sum, 0
  )

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Chrome className="h-6 w-6 text-orange-500" />
            TikTok Scanner
          </h1>
          <p className="text-muted-foreground mt-1">
            Extrae comentarios y contenido de TikTok directamente desde Chrome
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Scan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Sesiones totales</p>
          <p className="text-2xl font-bold">{initialSessions.length}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <p className="text-sm text-orange-600 dark:text-orange-400">Comentarios extraidos</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{totalComments}</p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
          <p className="text-sm text-violet-600 dark:text-violet-400">Videos encontrados</p>
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{totalVideos}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Completadas</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {initialSessions.filter((s) => s.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {uniqueAvatarNames.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Avatar:</span>
            <select
              value={avatarFilter}
              onChange={(e) => setAvatarFilter(e.target.value)}
              className="h-8 px-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="">Todos</option>
              {uniqueAvatarNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipo:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 px-2 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Todos</option>
            <option value="comments">Comentarios</option>
            <option value="search">Busqueda</option>
            <option value="profile">Perfil</option>
            <option value="feed">Feed</option>
          </select>
        </div>
      </div>

      {/* Session list */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <Chrome className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No hay sesiones de scan aun</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea un nuevo scan para empezar a extraer datos de TikTok
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((session) => {
            const typeConfig = SCAN_TYPE_CONFIG[session.scanType] || SCAN_TYPE_CONFIG.comments
            const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending
            const TypeIcon = typeConfig.icon

            return (
              <Link
                key={session.id}
                href={`/research/tiktok/${session.id}`}
                className="block border rounded-lg bg-card p-4 hover:border-muted-foreground/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <TypeIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium">{typeConfig.label}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${statusConfig.className}`}>
                          {statusConfig.label}
                        </Badge>
                        {session.avatarName && (
                          <span className="text-xs text-muted-foreground">
                            {session.avatarName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.query || shortenUrl(session.sourceUrl)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold">{session.totalItems}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(session.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <TikTokScanForm
          avatars={avatars}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
