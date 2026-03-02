'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
  Radar,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from 'lucide-react'

interface ScoutSession {
  id: string
  status: string
  query: string
  totalFindings: number
  avatarName: string
  createdAt: string
}

interface ScoutSessionListProps {
  sessions: ScoutSession[]
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

export function ScoutSessionList({ sessions }: ScoutSessionListProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 bg-card border rounded-lg">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay misiones todavia</h3>
        <p className="text-muted-foreground">
          Inicia tu primera mision para explorar TikTok con IA
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => {
        const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.running
        const StatusIcon = statusConfig.icon

        return (
          <Link
            key={session.id}
            href={`/research/scout/${session.id}`}
            className="group bg-card border rounded-lg p-4 hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-cyan-500" />
                <Badge className={`text-xs ${statusConfig.className}`}>
                  <StatusIcon className={`h-3 w-3 mr-1 ${session.status === 'running' ? 'animate-spin' : ''}`} />
                  {statusConfig.label}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(session.createdAt)}
              </span>
            </div>

            <p className="text-sm font-medium mb-2 line-clamp-2">
              {session.query}
            </p>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {session.avatarName}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.totalFindings} hallazgos
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
