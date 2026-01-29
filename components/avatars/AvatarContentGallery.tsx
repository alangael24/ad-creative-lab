"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MultiFileUpload } from '@/components/ui/multi-file-upload'
import {
  Plus,
  X,
  Play,
  Pencil,
  Trash2,
  AlertCircle,
  ExternalLink,
  Filter,
  Link2
} from 'lucide-react'

// Helper to extract TikTok video ID from URL
function extractTikTokVideoId(url: string): string | null {
  const match = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/)
  if (match) return match[1]
  return null
}

// Extract embed ID from stored URL
function extractEmbedId(url: string, mediaType: string): string | null {
  if (mediaType === 'tiktok_embed') {
    return extractTikTokVideoId(url)
  }
  if (mediaType === 'youtube_embed') {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]+)/)
    return ytMatch ? ytMatch[1] : null
  }
  if (mediaType === 'instagram_embed') {
    const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/)
    return igMatch ? igMatch[1] : null
  }
  return null
}

function detectPlatformFromUrl(url: string): { platform: string; mediaType: string; embedId?: string } {
  const lowerUrl = url.toLowerCase()

  if (lowerUrl.includes('tiktok.com')) {
    const videoId = extractTikTokVideoId(url)
    return { platform: 'tiktok', mediaType: videoId ? 'tiktok_embed' : 'video', embedId: videoId || undefined }
  }

  if (lowerUrl.includes('youtube.com/watch') || lowerUrl.includes('youtu.be/')) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
    const videoId = ytMatch ? ytMatch[1] : null
    return { platform: 'youtube', mediaType: videoId ? 'youtube_embed' : 'video', embedId: videoId || undefined }
  }

  if (lowerUrl.includes('youtube.com/shorts/')) {
    const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]+)/)
    const videoId = shortsMatch ? shortsMatch[1] : null
    return { platform: 'shorts', mediaType: videoId ? 'youtube_embed' : 'video', embedId: videoId || undefined }
  }

  if (lowerUrl.includes('instagram.com/reel/') || lowerUrl.includes('instagram.com/p/')) {
    const reelMatch = url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/)
    const reelId = reelMatch ? reelMatch[1] : null
    return { platform: 'instagram', mediaType: reelId ? 'instagram_embed' : 'video', embedId: reelId || undefined }
  }

  return { platform: 'other', mediaType: 'video' }
}

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
  const [uploadMode, setUploadMode] = useState<'link' | 'single' | 'bulk'>('link')
  const [editingContent, setEditingContent] = useState<AvatarContent | null>(null)
  const [selectedContent, setSelectedContent] = useState<AvatarContent | null>(null)
  const [linkUrls, setLinkUrls] = useState('')
  const [linkPreviews, setLinkPreviews] = useState<Array<{ url: string; platform: string; mediaType: string; embedId?: string }>>([])
  const [isAddingLinks, setIsAddingLinks] = useState(false)
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
          mediaUrl: '', mediaType: 'video', title: '', sourceUrl: '', platform: '',
          creator: '', style: '', duration: '', whatWorks: '', notes: '', tags: [],
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
        body: JSON.stringify({ items: files }),
      })
      if (response.ok) {
        setShowAddModal(false)
        fetchContent()
      }
    } catch (error) {
      console.error('Error bulk uploading:', error)
    }
  }

  const handleLinksChange = (text: string) => {
    setLinkUrls(text)
    const urls = text.split(/[\n\s]+/).map(u => u.trim()).filter(u => u.startsWith('http'))
    const previews = urls.map(url => ({ url, ...detectPlatformFromUrl(url) }))
    setLinkPreviews(previews)
  }

  const handleLinksSubmit = async () => {
    if (linkPreviews.length === 0) return
    setIsAddingLinks(true)
    try {
      const response = await fetch(`/api/avatars/${avatarId}/content/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: linkPreviews.map(p => ({
            mediaUrl: p.url,
            mediaType: p.mediaType,
            platform: p.platform,
            sourceUrl: p.url,
          })),
        }),
      })
      if (response.ok) {
        setShowAddModal(false)
        setLinkUrls('')
        setLinkPreviews([])
        fetchContent()
      }
    } catch (error) {
      console.error('Error adding links:', error)
    } finally {
      setIsAddingLinks(false)
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
      const response = await fetch(`/api/avatars/${avatarId}/content/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchContent()
        setSelectedContent(null)
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
        tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
      }))
    }
  }

  const contentMissingDetails = (item: AvatarContent) => !item.title && !item.style && !item.whatWorks
  const missingDetailsCount = content.filter(contentMissingDetails).length
  const filteredContent = filterMissingDetails ? content.filter(contentMissingDetails) : content

  const getPlatformConfig = (platform: string | null) => PLATFORMS.find(p => p.value === platform)
  const getStyleConfig = (style: string | null) => STYLES.find(s => s.value === style)
  const parseJsonArray = (str: string | null): string[] => {
    if (!str) return []
    try { return JSON.parse(str) } catch { return [] }
  }

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

      {/* Pinterest-style Masonry Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            {filterMissingDetails ? 'No hay contenido sin detalles' : 'No hay contenido guardado aún'}
          </p>
          {!filterMissingDetails && (
            <Button variant="outline" onClick={() => setShowAddModal(true)}>
              <Link2 className="h-4 w-4 mr-2" />
              Agregar contenido
            </Button>
          )}
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
          {filteredContent.map((item) => {
            const platformConfig = getPlatformConfig(item.platform)
            const styleConfig = getStyleConfig(item.style)
            const tags = parseJsonArray(item.tags)
            const isEmbed = item.mediaType.includes('_embed')
            const embedId = isEmbed ? extractEmbedId(item.mediaUrl, item.mediaType) : null

            return (
              <div
                key={item.id}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => setSelectedContent(item)}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {/* TikTok Embed - Clean player without description/music */}
                    {item.mediaType === 'tiktok_embed' && embedId ? (
                      <div className="relative" style={{ paddingBottom: '178%' }}>
                        <iframe
                          src={`https://www.tiktok.com/player/v1/${embedId}?description=0&music_info=0&controls=1`}
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 'none' }}
                          allowFullScreen
                          allow="autoplay; fullscreen"
                        />
                      </div>
                    ) : item.mediaType === 'youtube_embed' && embedId ? (
                      /* YouTube Embed */
                      <div className="relative" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={`https://www.youtube.com/embed/${embedId}`}
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    ) : item.mediaType === 'video' ? (
                      /* Uploaded Video */
                      <>
                        <video
                          src={item.mediaUrl}
                          className="w-full object-cover"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-12 w-12 text-white drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      /* Image */
                      <img src={item.mediaUrl} alt="" className="w-full object-cover" />
                    )}

                    {/* Platform Badge */}
                    {platformConfig && !isEmbed && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-white/90 dark:bg-black/70">
                          {platformConfig.icon}
                        </Badge>
                      </div>
                    )}

                    {/* Missing details indicator */}
                    {contentMissingDetails(item) && (
                      <div className="absolute top-2 right-2">
                        <Badge className="text-xs bg-yellow-500 text-white">
                          Sin detalles
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-2 space-y-1">
                    {item.title && (
                      <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                    )}

                    {item.creator && (
                      <p className="text-xs text-muted-foreground">{item.creator}</p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {styleConfig && (
                        <Badge variant="outline" className="text-[10px]">
                          {styleConfig.label}
                        </Badge>
                      )}
                      {tags.slice(0, 2).map(tag => {
                        const tagConfig = CONTENT_TAGS.find(t => t.value === tag)
                        return tagConfig ? (
                          <Badge key={tag} className={`text-[10px] ${tagConfig.color} text-white`}>
                            {tagConfig.label}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedContent(null)}>
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">{selectedContent.title || 'Contenido'}</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditingContent(selectedContent); setSelectedContent(null) }}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(selectedContent.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                </Button>
                <a href={selectedContent.sourceUrl || selectedContent.mediaUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" /> Abrir
                  </Button>
                </a>
                <button onClick={() => setSelectedContent(null)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 p-4">
              {/* Media */}
              <div className="bg-black rounded-lg overflow-hidden">
                {selectedContent.mediaType === 'tiktok_embed' && extractEmbedId(selectedContent.mediaUrl, 'tiktok_embed') ? (
                  <div className="relative" style={{ paddingBottom: '178%' }}>
                    <iframe
                      src={`https://www.tiktok.com/player/v1/${extractEmbedId(selectedContent.mediaUrl, 'tiktok_embed')}?description=0&music_info=0&controls=1`}
                      className="absolute inset-0 w-full h-full"
                      style={{ border: 'none' }}
                      allowFullScreen
                      allow="autoplay; fullscreen"
                    />
                  </div>
                ) : selectedContent.mediaType === 'youtube_embed' && extractEmbedId(selectedContent.mediaUrl, 'youtube_embed') ? (
                  <div className="relative" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${extractEmbedId(selectedContent.mediaUrl, 'youtube_embed')}`}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                ) : selectedContent.mediaType === 'video' ? (
                  <video src={selectedContent.mediaUrl} controls className="w-full" />
                ) : (
                  <img src={selectedContent.mediaUrl} alt="" className="w-full" />
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                {selectedContent.platform && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Plataforma</p>
                    <Badge>{getPlatformConfig(selectedContent.platform)?.icon} {getPlatformConfig(selectedContent.platform)?.label}</Badge>
                  </div>
                )}

                {selectedContent.creator && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Creador</p>
                    <p className="text-sm">{selectedContent.creator}</p>
                  </div>
                )}

                {selectedContent.style && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estilo</p>
                    <Badge variant="outline">{getStyleConfig(selectedContent.style)?.label}</Badge>
                  </div>
                )}

                {selectedContent.whatWorks && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">¿Por qué funciona?</p>
                    <p className="text-sm">{selectedContent.whatWorks}</p>
                  </div>
                )}

                {parseJsonArray(selectedContent.tags).length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {parseJsonArray(selectedContent.tags).map(tag => {
                        const tagConfig = CONTENT_TAGS.find(t => t.value === tag)
                        return tagConfig ? (
                          <Badge key={tag} className={`${tagConfig.color} text-white`}>{tagConfig.label}</Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {selectedContent.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm">{selectedContent.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">Agregar Contenido de Referencia</h3>
              <button onClick={() => setShowAddModal(false)}><X className="h-5 w-5" /></button>
            </div>

            {/* Tabs */}
            <div className="border-b">
              <div className="flex">
                <button onClick={() => setUploadMode('link')} className={`px-4 py-2 text-sm font-medium border-b-2 ${uploadMode === 'link' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                  <Link2 className="h-4 w-4 inline mr-1" /> Pegar Links
                </button>
                <button onClick={() => setUploadMode('single')} className={`px-4 py-2 text-sm font-medium border-b-2 ${uploadMode === 'single' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                  Subida Individual
                </button>
                <button onClick={() => setUploadMode('bulk')} className={`px-4 py-2 text-sm font-medium border-b-2 ${uploadMode === 'bulk' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}>
                  Subida Múltiple
                </button>
              </div>
            </div>

            <div className="p-4">
              {uploadMode === 'link' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Pega los links de TikTok, YouTube o Instagram (uno por línea)
                    </label>
                    <Textarea
                      value={linkUrls}
                      onChange={(e) => handleLinksChange(e.target.value)}
                      placeholder={`https://www.tiktok.com/@usuario/video/123456789\nhttps://www.youtube.com/watch?v=xxxxx`}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  {linkPreviews.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{linkPreviews.length} link{linkPreviews.length !== 1 ? 's' : ''} detectado{linkPreviews.length !== 1 ? 's' : ''}:</p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {linkPreviews.map((preview, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                            <span>{PLATFORMS.find(p => p.value === preview.platform)?.icon || '🔗'}</span>
                            <span className="text-xs font-medium uppercase">{preview.platform}</span>
                            {preview.mediaType.includes('_embed') ? (
                              <span className="text-xs text-green-600">✓ Embebible</span>
                            ) : (
                              <span className="text-xs text-yellow-600">Solo link</span>
                            )}
                            <span className="text-xs text-muted-foreground truncate flex-1">{preview.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                    <Button onClick={handleLinksSubmit} disabled={linkPreviews.length === 0 || isAddingLinks}>
                      {isAddingLinks ? 'Guardando...' : `Guardar ${linkPreviews.length} link${linkPreviews.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </div>
              ) : uploadMode === 'single' ? (
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">URL del Media *</label>
                    <Input value={formData.mediaUrl} onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })} placeholder="https://..." required />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Tipo</label>
                      <select value={formData.mediaType} onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })} className="w-full h-10 px-3 rounded-md border bg-background">
                        <option value="video">Video</option>
                        <option value="image">Imagen</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Plataforma</label>
                      <select value={formData.platform} onChange={(e) => setFormData({ ...formData, platform: e.target.value })} className="w-full h-10 px-3 rounded-md border bg-background">
                        <option value="">Seleccionar...</option>
                        {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Título</label>
                      <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Descripción breve..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Creador (@handle)</label>
                      <Input value={formData.creator} onChange={(e) => setFormData({ ...formData, creator: e.target.value })} placeholder="@usuario" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Estilo</label>
                      <select value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value })} className="w-full h-10 px-3 rounded-md border bg-background">
                        <option value="">Seleccionar...</option>
                        {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duración</label>
                      <Input value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="ej: 30s, 1min" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">¿Por qué este avatar consume esto?</label>
                    <Textarea value={formData.whatWorks} onChange={(e) => setFormData({ ...formData, whatWorks: e.target.value })} placeholder="Es relatable porque..." rows={2} />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {CONTENT_TAGS.map(tag => (
                        <button key={tag.value} type="button" onClick={() => toggleTag(tag.value)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${formData.tags.includes(tag.value) ? `${tag.color} text-white` : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Sube múltiples videos/imágenes a la vez. Podrás editar los detalles después.</p>
                  <MultiFileUpload onUploadComplete={handleBulkUpload} maxFiles={100} />
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
              <button onClick={() => setEditingContent(null)}><X className="h-5 w-5" /></button>
            </div>

            <div className="p-4">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Título</label>
                    <Input value={editingContent.title || ''} onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })} placeholder="Descripción breve..." />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Creador (@handle)</label>
                    <Input value={editingContent.creator || ''} onChange={(e) => setEditingContent({ ...editingContent, creator: e.target.value })} placeholder="@usuario" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Plataforma</label>
                    <select value={editingContent.platform || ''} onChange={(e) => setEditingContent({ ...editingContent, platform: e.target.value })} className="w-full h-10 px-3 rounded-md border bg-background">
                      <option value="">Seleccionar...</option>
                      {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.icon} {p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Estilo</label>
                    <select value={editingContent.style || ''} onChange={(e) => setEditingContent({ ...editingContent, style: e.target.value })} className="w-full h-10 px-3 rounded-md border bg-background">
                      <option value="">Seleccionar...</option>
                      {STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">¿Por qué este avatar consume esto?</label>
                  <Textarea value={editingContent.whatWorks || ''} onChange={(e) => setEditingContent({ ...editingContent, whatWorks: e.target.value })} placeholder="Es relatable porque..." rows={2} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_TAGS.map(tag => {
                      const currentTags = editingContent.tags ? JSON.parse(editingContent.tags) : []
                      return (
                        <button key={tag.value} type="button" onClick={() => toggleTag(tag.value, true)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${currentTags.includes(tag.value) ? `${tag.color} text-white` : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                          {tag.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notas</label>
                  <Textarea value={editingContent.notes || ''} onChange={(e) => setEditingContent({ ...editingContent, notes: e.target.value })} placeholder="Notas adicionales..." rows={2} />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setEditingContent(null)}>Cancelar</Button>
                  <Button type="submit">Guardar Cambios</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
