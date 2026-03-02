'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Radar, Plus } from 'lucide-react'
import { ScoutSessionList } from '@/components/research/scout/ScoutSessionList'
import { ScoutMissionForm } from '@/components/research/scout/ScoutMissionForm'

interface Avatar {
  id: string
  name: string
  description: string | null
  painPoints: string
  desires: string
}

interface ScoutSession {
  id: string
  status: string
  query: string
  totalFindings: number
  avatarName: string
  createdAt: string
}

interface ScoutHubProps {
  avatars: Avatar[]
  initialSessions: ScoutSession[]
}

export function ScoutHub({ avatars, initialSessions }: ScoutHubProps) {
  const [showForm, setShowForm] = useState(false)
  const [avatarFilter, setAvatarFilter] = useState('')

  const filteredSessions = avatarFilter
    ? initialSessions.filter((s) => s.avatarName === avatarFilter)
    : initialSessions

  const uniqueAvatarNames = Array.from(new Set(initialSessions.map((s) => s.avatarName)))

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radar className="h-6 w-6 text-cyan-500" />
            TikTok Scout
          </h1>
          <p className="text-muted-foreground mt-1">
            Envia una IA a explorar TikTok y encontrar insights para tus avatars
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Mision
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Misiones totales</p>
          <p className="text-2xl font-bold">{initialSessions.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Hallazgos totales</p>
          <p className="text-2xl font-bold">
            {initialSessions.reduce((sum, s) => sum + s.totalFindings, 0)}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">En progreso</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {initialSessions.filter((s) => s.status === 'running').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Completadas</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {initialSessions.filter((s) => s.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Avatar filter */}
      {uniqueAvatarNames.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">Filtrar por avatar:</span>
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

      {/* Session list */}
      <ScoutSessionList sessions={filteredSessions} />

      {/* Mission form modal */}
      {showForm && (
        <ScoutMissionForm
          avatars={avatars}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
