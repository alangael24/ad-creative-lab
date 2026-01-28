"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RESEARCH_CATEGORIES, RESEARCH_SOURCES } from '@/lib/constants'
import { Users, Target, Sparkles, Ban, MessageSquare, Lightbulb, Copy, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface ResearchItem {
  id: string
  source: string
  url: string | null
  content: string
  category: string
  context: string | null
}

interface Avatar {
  id: string
  name: string
  description: string | null
  painPoints: string
  desires: string
  objections: string | null
  language: string | null
  ageRange: string | null
  gender: string | null
  organicStyle: string | null
  research: ResearchItem[]
}

interface ResearchSidebarProps {
  selectedAvatarId: string | null
  onSelectAvatar: (id: string | null) => void
  onInsertText: (text: string, field: 'concept' | 'hypothesis') => void
}

export function ResearchSidebar({ selectedAvatarId, onSelectAvatar, onInsertText }: ResearchSidebarProps) {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Fetch all avatars on mount
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const response = await fetch('/api/avatars')
        if (response.ok) {
          const data = await response.json()
          setAvatars(data)
        }
      } catch (error) {
        console.error('Error fetching avatars:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAvatars()
  }, [])

  // Fetch selected avatar details with research
  useEffect(() => {
    if (!selectedAvatarId) {
      setSelectedAvatar(null)
      return
    }

    const fetchAvatar = async () => {
      try {
        const response = await fetch(`/api/avatars/${selectedAvatarId}`)
        if (response.ok) {
          const data = await response.json()
          setSelectedAvatar(data)
        }
      } catch (error) {
        console.error('Error fetching avatar:', error)
      }
    }
    fetchAvatar()
  }, [selectedAvatarId])

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pain_point': return <Target className="h-3 w-3" />
      case 'desire': return <Sparkles className="h-3 w-3" />
      case 'objection': return <Ban className="h-3 w-3" />
      case 'language': return <MessageSquare className="h-3 w-3" />
      case 'insight': return <Lightbulb className="h-3 w-3" />
      default: return null
    }
  }

  const getCategoryConfig = (category: string) =>
    RESEARCH_CATEGORIES.find(c => c.value === category)

  const getSourceConfig = (source: string) =>
    RESEARCH_SOURCES.find(s => s.value === source)

  // Parse JSON arrays safely
  const parseJsonArray = (str: string | null): string[] => {
    if (!str) return []
    try {
      return JSON.parse(str) as string[]
    } catch {
      return []
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 animate-pulse mx-auto mb-2 text-purple-500" />
          <p className="text-sm text-muted-foreground">Cargando avatars...</p>
        </CardContent>
      </Card>
    )
  }

  if (avatars.length === 0) {
    return (
      <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
          <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
            No hay avatars creados. Crea uno para usar tu research.
          </p>
          <Link href="/research/avatars/new">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Crear Avatar
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Avatar Selector */}
      <Card className="border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Users className="h-4 w-4" />
            Research del Avatar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={selectedAvatarId || ''}
            onChange={(e) => onSelectAvatar(e.target.value || null)}
            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="">Selecciona un avatar...</option>
            {avatars.map((avatar) => (
              <option key={avatar.id} value={avatar.id}>
                {avatar.name}
              </option>
            ))}
          </select>

          {!selectedAvatar && selectedAvatarId === null && (
            <p className="text-xs text-muted-foreground text-center">
              Selecciona un avatar para ver sus pain points, deseos y hallazgos de research
            </p>
          )}
        </CardContent>
      </Card>

      {/* Avatar Research Content */}
      {selectedAvatar && (
        <>
          {/* Avatar Info */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{selectedAvatar.name}</p>
                  {selectedAvatar.description && (
                    <p className="text-xs text-muted-foreground">{selectedAvatar.description}</p>
                  )}
                </div>
                <Link
                  href={`/research/avatars/${selectedAvatar.id}`}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Ver
                </Link>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedAvatar.ageRange && (
                  <Badge variant="secondary" className="text-xs">{selectedAvatar.ageRange} anos</Badge>
                )}
                {selectedAvatar.gender && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedAvatar.gender === 'female' ? 'F' : selectedAvatar.gender === 'male' ? 'M' : 'Todos'}
                  </Badge>
                )}
                {selectedAvatar.organicStyle && (
                  <Badge variant="secondary" className="text-xs">{selectedAvatar.organicStyle}</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pain Points from Avatar */}
          {parseJsonArray(selectedAvatar.painPoints).length > 0 && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-2 bg-red-50 dark:bg-red-950/30">
                <CardTitle className="text-xs flex items-center gap-1 text-red-700 dark:text-red-400">
                  <Target className="h-3 w-3" />
                  Pain Points ({parseJsonArray(selectedAvatar.painPoints).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {parseJsonArray(selectedAvatar.painPoints).map((point, i) => (
                  <div
                    key={i}
                    className="group p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <p className="text-red-800 dark:text-red-200">{point}</p>
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => onInsertText(point, 'hypothesis')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Hipotesis
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => handleCopy(point, `pain-${i}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedId === `pain-${i}` ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Desires from Avatar */}
          {parseJsonArray(selectedAvatar.desires).length > 0 && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2 bg-green-50 dark:bg-green-950/30">
                <CardTitle className="text-xs flex items-center gap-1 text-green-700 dark:text-green-400">
                  <Sparkles className="h-3 w-3" />
                  Deseos ({parseJsonArray(selectedAvatar.desires).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {parseJsonArray(selectedAvatar.desires).map((desire, i) => (
                  <div
                    key={i}
                    className="group p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                  >
                    <p className="text-green-800 dark:text-green-200">{desire}</p>
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => onInsertText(desire, 'hypothesis')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Hipotesis
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => handleCopy(desire, `desire-${i}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedId === `desire-${i}` ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Objections from Avatar */}
          {parseJsonArray(selectedAvatar.objections).length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2 bg-amber-50 dark:bg-amber-950/30">
                <CardTitle className="text-xs flex items-center gap-1 text-amber-700 dark:text-amber-400">
                  <Ban className="h-3 w-3" />
                  Objeciones ({parseJsonArray(selectedAvatar.objections).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-1">
                {parseJsonArray(selectedAvatar.objections).map((objection, i) => (
                  <div
                    key={i}
                    className="group p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                  >
                    <p className="text-amber-800 dark:text-amber-200">{objection}</p>
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => onInsertText(objection, 'hypothesis')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Hipotesis
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs px-2"
                        onClick={() => handleCopy(objection, `obj-${i}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedId === `obj-${i}` ? 'Copiado!' : 'Copiar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Language from Avatar */}
          {selectedAvatar.language && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950/30">
                <CardTitle className="text-xs flex items-center gap-1 text-blue-700 dark:text-blue-400">
                  <MessageSquare className="h-3 w-3" />
                  Lenguaje
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="group p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <p className="text-blue-800 dark:text-blue-200 italic">&quot;{selectedAvatar.language}&quot;</p>
                  <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-2"
                      onClick={() => handleCopy(selectedAvatar.language!, 'lang')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {copiedId === 'lang' ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Research Items */}
          {selectedAvatar.research && selectedAvatar.research.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Hallazgos de Research ({selectedAvatar.research.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 space-y-2 max-h-96 overflow-y-auto">
                {selectedAvatar.research.map((item) => {
                  const categoryConfig = getCategoryConfig(item.category)
                  const sourceConfig = getSourceConfig(item.source)

                  return (
                    <div
                      key={item.id}
                      className="group p-2 bg-muted/50 rounded text-xs hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1 py-0 ${categoryConfig?.color || ''}`}
                        >
                          {getCategoryIcon(item.category)}
                          <span className="ml-1">{categoryConfig?.label || item.category}</span>
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {sourceConfig?.icon} {sourceConfig?.label}
                        </span>
                      </div>
                      <p className="text-foreground">&quot;{item.content}&quot;</p>
                      {item.context && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Contexto: {item.context}
                        </p>
                      )}
                      <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2"
                          onClick={() => onInsertText(item.content, 'hypothesis')}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Hipotesis
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2"
                          onClick={() => onInsertText(item.content, 'concept')}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Concepto
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2"
                          onClick={() => handleCopy(item.content, item.id)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {copiedId === item.id ? 'Copiado!' : 'Copiar'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
