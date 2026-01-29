"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MultiFileUpload } from '@/components/ui/multi-file-upload'
import {
  Plus,
  Upload,
  X,
  Play,
  Pencil,
  Trash2,
  AlertCircle,
  ExternalLink,
  Filter
} from 'lucide-react'

interface AvatarContent {
  id: string
  mediaUrl: string
  mediaType: string
  thumbnailUrl: string | null
  title: string | null
  sourceUrl: string | null
  platform: string | null
  creator: string | null
  style: string | null
  duration: string | null
  whatWorks: string | null
  notes: string | null
  tags: string | null
  createdAt: Date | string
}

interface AvatarContentGalleryProps {
  avatarId: string
  avatarName: string
}

const PLATFORMS = [
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'reels', label: 'Reels', icon: '🎬' },
  { value: 'shorts', label: 'Shorts', icon: '📱' },
  { value: 'other', label: 'Otro', icon: '🔗' },
]

const STYLES = [
  { value: 'talking_head', label: 'Talking Head' },
  { value: 'vlog', label: 'Vlog' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'storytime', label: 'Storytime' },
  { value: 'grwm', label: 'GRWM' },
  { value: 'review', label: 'Review' },
  { value: 'transformation', label: 'Transformación' },
  { value: 'comedy', label: 'Comedia' },
  { value: 'emotional', label: 'Emocional' },
  { value: 'trend', label: 'Trend' },
  { value: 'other', label: 'Otro' },
]

const CONTENT_TAGS = [
  { value: 'relatable', label: 'Relatable', color: 'bg-blue-500' },
  { value: 'funny', label: 'Gracioso', color: 'bg-yellow-500' },
  { value: 'emotional', label: 'Emocional', color: 'bg-pink-500' },
  { value: 'educational', label: 'Educativo', color: 'bg-green-500' },
  { value: 'aspirational', label: 'Aspiracional', color: 'bg-purple-500' },
  { value: 'authentic', label: 'Auténtico', color: 'bg-orange-500' },
  { value: 'trending', label: 'Trending', color: 'bg-red-500' },
  { value: 'raw', label: 'Raw/Sin editar', color: 'bg-gray-500' },
]

export function AvatarContentGallery({ avatarId, avatarName }: AvatarContentGalleryProps) {
  const [content, setContent] = useState<AvatarContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single')
  const [editingContent, setEditingContent] = useState<AvatarContent | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [filterMissingDetails, setFilterMissingDetails] = useState(false)

  // Form state for single upload
  const [formData, setFormData] = useState({
    mediaUrl: '',
    mediaType: 'video',
    title: '',
    sourceUrl: '',
    platform: '',
    creator: '',
    style: '',
    duration: '',
    whatWorks: '',
    notes: '',
    tags: [] as string[],
  })

  useEffect(() => {
    fetchContent()
  }, [avatarId])

  const fetchContent = async () => {
    try {
      const response = await fetch(`/api/avatars/${avatarId}/content`)
      if (response.ok) {
        const data = await response.json()
        setContent(data)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/avatars/${avatarId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.length > 0 ? JSON.stringify(formData.tags) : null,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        setFormData({
          mediaUrl: '',
          mediaType: 'video',
          title: '',
          sourceUrl: '',
          platform: '',
          creator: '',
          style: '',
          duration: '',
          whatWorks: '',
          notes: '',
          tags: [],
        })
        fetchContent()
      }
    } catch (error) {
      console.error('Error creating content:', error)
    }
  }

  const handleBulkUpload = async (files: Array<{ mediaUrl: string; mediaType: string }>) => {
    try {
      const response = await fetch(`/api/avatars/${avatarId}/content/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: files.map(f => ({
            mediaUrl: f.mediaUrl,
            mediaType: f.mediaType,
          })),
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        fetchContent()
      }
    } catch (error) {
      console.error('Error bulk uploading:', error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContent) return

    try {
      const response = await fetch(`/api/avatars/${avatarId}/content/${editingContent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingContent),
      })

      if (response.ok) {
        setEditingContent(null)
        fetchContent()
      }
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este contenido?')) return

    try {
      const response = await fetch(`/api/avatars/${avatarId}/content/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchContent()
      }
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  const toggleTag = (tag: string, isEditing: boolean = false) => {
    if (isEditing && editingContent) {
      const currentTags = editingContent.tags ? JSON.parse(editingContent.tags) : []
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t: string) => t !== tag)
        : [...currentTags, tag]
      setEditingContent({ ...editingContent, tags: JSON.stringify(newTags) })
    } else {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.includes(tag)
          ? prev.tags.filter(t => t !== tag)
          : [...prev.tags, tag]
      }))
    }
  }

  const contentMissingDetails = (item: AvatarContent) => {
    return !item.title && !item.platform && !item.style && !item.whatWorks
  }

  const missingDetailsCount = content.filter(contentMissingDetails).length

  const filteredContent = filterMissingDetails
    ? content.filter(contentMissingDetails)
    : content

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando contenido...</div>
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contenido Nativo</h3>
          <p className="text-sm text-muted-foreground">
            Videos/contenido que {avatarName} consume normalmente
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Contenido
        </Button>
      </div>

      {/* Alert for missing details */}
      {missingDetailsCount > 0 && (
        <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <p className="text-sm flex-1">
            <span className="font-medium">{missingDetailsCount} contenido{missingDetailsCount !== 1 ? 's' : ''}</span> sin detalles.
            Edita para agregar información del estilo y por qué funciona.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterMissingDetails(!filterMissingDetails)}
            className={filterMissingDetails ? 'bg-yellow-500/20' : ''}
          >
            <Filter className="h-4 w-4 mr-1" />
            {filterMissingDetails ? 'Ver todos' : 'Sin detalles'}
          </Button>
        </div>
      )}

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            {filterMissingDetails
              ? 'No hay contenido sin detalles'
              : 'No hay contenido guardado aún'}
          </p>
          {!filterMissingDetails && (
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir contenido de referencia
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredContent.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-[9/16] rounded-lg overflow-hidden bg-muted cursor-pointer"
              onClick={() => setPlayingVideo(item.id)}
            >
              {/* Media */}
              {item.mediaType === 'video' ? (
                playingVideo === item.id ? (
                  <video
                    src={item.mediaUrl}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <video
                      src={item.mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-10 w-10 text-white" />
                    </div>
                  </>
                )
              ) : (
                <img
                  src={item.mediaUrl}
                  alt={item.title || ''}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Missing details indicator */}
              {contentMissingDetails(item) && (
                <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">
                  Sin detalles
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  {item.title && (
                    <p className="text-white text-xs font-medium truncate">{item.title}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {item.platform && (
                      <span className="text-white/80 text-xs">
                        {PLATFORMS.find(p => p.value === item.platform)?.icon}
                      </span>
                    )}
                    {item.style && (
                      <span className="text-white/60 text-xs truncate">
                        {STYLES.find(s => s.value === item.style)?.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingContent(item)
                    }}
                    className="p-1.5 bg-black/70 rounded-full hover:bg-black/90"
                  >
                    <Pencil className="h-3 w-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(item.id)
                    }}
                    className="p-1.5 bg-black/70 rounded-full hover:bg-red-600"
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">Agregar Contenido de Referencia</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex">
                <button
                  onClick={() => setUploadMode('single')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    uploadMode === 'single'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground'
                  }`}
                >
                  Subida Individual
                </button>
                <button
                  onClick={() => setUploadMode('bulk')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    uploadMode === 'bulk'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground'
                  }`}
                >
                  Subida Múltiple
                </button>
              </div>
            </div>

            <div className="p-4">
              {uploadMode === 'single' ? (
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">URL del Media *</label>
                    <Input
                      value={formData.mediaUrl}
                      onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tipo</label>
                      <select
                        value={formData.mediaType}
                        onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border bg-background"
                      >
                        <option value="video">Video</option>
                        <option value="image">Imagen</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Plataforma</label>
                      <select
                        value={formData.platform}
                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border bg-background"
                      >
                        <option value="">Seleccionar...</option>
                        {PLATFORMS.map(p => (
                          <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Título</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Descripción breve..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Creador (@handle)</label>
                      <Input
                        value={formData.creator}
                        onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                        placeholder="@usuario"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Estilo</label>
                      <select
                        value={formData.style}
                        onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border bg-background"
                      >
                        <option value="">Seleccionar...</option>
                        {STYLES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duración</label>
                      <Input
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        placeholder="ej: 30s, 1min, 3min"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">URL Original</label>
                    <Input
                      value={formData.sourceUrl}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">¿Por qué este avatar consume esto?</label>
                    <Textarea
                      value={formData.whatWorks}
                      onChange={(e) => setFormData({ ...formData, whatWorks: e.target.value })}
                      placeholder="Es relatable porque..., Le gusta el formato porque..."
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_TAGS.map(tag => (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => toggleTag(tag.value)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            formData.tags.includes(tag.value)
                              ? `${tag.color} text-white`
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Notas</label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Notas adicionales..."
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      Guardar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sube múltiples videos/imágenes a la vez. Podrás editar los detalles después.
                  </p>
                  <MultiFileUpload
                    onUploadComplete={handleBulkUpload}
                    maxFiles={100}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">Editar Contenido</h3>
              <button onClick={() => setEditingContent(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Preview */}
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  {editingContent.mediaType === 'video' ? (
                    <video
                      src={editingContent.mediaUrl}
                      className="w-full h-full object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={editingContent.mediaUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Título</label>
                    <Input
                      value={editingContent.title || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                      placeholder="Descripción breve..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Creador (@handle)</label>
                    <Input
                      value={editingContent.creator || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, creator: e.target.value })}
                      placeholder="@usuario"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Plataforma</label>
                    <select
                      value={editingContent.platform || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, platform: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                    >
                      <option value="">Seleccionar...</option>
                      {PLATFORMS.map(p => (
                        <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Estilo</label>
                    <select
                      value={editingContent.style || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, style: e.target.value })}
                      className="w-full h-10 px-3 rounded-md border bg-background"
                    >
                      <option value="">Seleccionar...</option>
                      {STYLES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Duración</label>
                    <Input
                      value={editingContent.duration || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, duration: e.target.value })}
                      placeholder="ej: 30s, 1min, 3min"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">URL Original</label>
                    <Input
                      value={editingContent.sourceUrl || ''}
                      onChange={(e) => setEditingContent({ ...editingContent, sourceUrl: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">¿Por qué este avatar consume esto?</label>
                  <Textarea
                    value={editingContent.whatWorks || ''}
                    onChange={(e) => setEditingContent({ ...editingContent, whatWorks: e.target.value })}
                    placeholder="Es relatable porque..., Le gusta el formato porque..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TAGS.map(tag => {
                      const currentTags = editingContent.tags ? JSON.parse(editingContent.tags) : []
                      return (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => toggleTag(tag.value, true)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            currentTags.includes(tag.value)
                              ? `${tag.color} text-white`
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notas</label>
                  <Textarea
                    value={editingContent.notes || ''}
                    onChange={(e) => setEditingContent({ ...editingContent, notes: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingContent(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
