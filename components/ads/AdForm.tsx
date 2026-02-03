"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/ui/file-upload'
import { CopilotSidebar } from '@/components/ads/CopilotSidebar'
import { ANGLES, AWARENESS_LEVELS, FORMATS, FUNNEL_STAGES, SOURCE_TYPES } from '@/lib/constants'
import { generateAdName } from '@/lib/name-generator'
import { getLocalDateString } from '@/lib/utils'
import { Target, Sparkles, Ban, Search, ChevronDown, ChevronUp, Brain, Zap } from 'lucide-react'

interface AvatarResearch {
  id: string
  name: string
  painPoints: string[]
  desires: string[]
  objections: string[]
  language: string | null
}

interface SubAvatar {
  id: string
  name: string
  painPoint: string
  desire: string
  trigger: string | null
  objection: string | null
  awareness: string
}

export function AdForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'research' | 'copilot'>('research')

  // Research data from all avatars
  const [avatarsResearch, setAvatarsResearch] = useState<AvatarResearch[]>([])
  const [researchSearch, setResearchSearch] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    painPoints: true,
    desires: true,
    objections: false,
  })

  const [formData, setFormData] = useState({
    concept: '',
    hypothesis: '',
    angleType: 'fear',
    angleDetail: '',
    awareness: 'unaware',
    format: 'static',
    funnelStage: 'cold',
    product: '',
    sourceType: 'original',
    sourceUrl: '',
    referenceMediaUrl: '',
    testingBudget: '50',
    thumbnailUrl: '',
    dueDate: '',
    avatarId: '',
    subAvatarId: '',
  })

  const [selectedAvatarId, setSelectedAvatarId] = useState('')
  const [subAvatars, setSubAvatars] = useState<SubAvatar[]>([])
  const [selectedSubAvatarId, setSelectedSubAvatarId] = useState('')

  // Fetch all avatars with their research data
  useEffect(() => {
    const fetchAvatarsResearch = async () => {
      try {
        const response = await fetch('/api/avatars')
        if (response.ok) {
          const avatars = await response.json()
          const parsed = avatars.map((avatar: {
            id: string
            name: string
            painPoints: string
            desires: string
            objections: string | null
            language: string | null
          }) => ({
            id: avatar.id,
            name: avatar.name,
            painPoints: JSON.parse(avatar.painPoints || '[]'),
            desires: JSON.parse(avatar.desires || '[]'),
            objections: avatar.objections ? JSON.parse(avatar.objections) : [],
            language: avatar.language,
          }))
          setAvatarsResearch(parsed)
        }
      } catch (error) {
        console.error('Error fetching avatars research:', error)
      }
    }
    fetchAvatarsResearch()
  }, [])

  // Fetch sub-avatars when avatar is selected
  useEffect(() => {
    if (selectedAvatarId) {
      const fetchSubAvatars = async () => {
        try {
          const response = await fetch(`/api/avatars/${selectedAvatarId}/sub-avatars`)
          if (response.ok) {
            const data = await response.json()
            setSubAvatars(data)
          }
        } catch (error) {
          console.error('Error fetching sub-avatars:', error)
        }
      }
      fetchSubAvatars()
    } else {
      setSubAvatars([])
      setSelectedSubAvatarId('')
    }
  }, [selectedAvatarId])

  // Handle sub-avatar selection - auto-fill angleDetail and awareness
  const handleSubAvatarSelect = (subAvatarId: string) => {
    setSelectedSubAvatarId(subAvatarId)

    if (subAvatarId) {
      const subAvatar = subAvatars.find(s => s.id === subAvatarId)
      if (subAvatar) {
        // Build angleDetail from the cluster
        const parts: string[] = []
        parts.push(`Pain: ${subAvatar.painPoint}`)
        parts.push(`Deseo: ${subAvatar.desire}`)
        if (subAvatar.trigger) parts.push(`Trigger: ${subAvatar.trigger}`)
        if (subAvatar.objection) parts.push(`Objeción: ${subAvatar.objection}`)

        setFormData(prev => ({
          ...prev,
          angleDetail: parts.join(' | '),
          awareness: subAvatar.awareness,
          subAvatarId: subAvatarId,
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        subAvatarId: '',
      }))
    }
  }

  const [generatedName, setGeneratedName] = useState('')

  // Generate name based on concept and format
  useEffect(() => {
    if (formData.concept && formData.format) {
      const name = generateAdName(
        formData.concept,
        formData.angleType as 'fear' | 'desire' | 'curiosity' | 'offer' | 'tutorial' | 'testimonial',
        formData.format as 'static' | 'video' | 'ugc' | 'carousel'
      )
      setGeneratedName(name)
    } else {
      setGeneratedName('')
    }
  }, [formData.concept, formData.angleType, formData.format])

  // Get all unique pain points, desires, objections across avatars (filtered by selected avatar)
  const getAllResearchItems = () => {
    const painPoints: Array<{ text: string; avatars: string[] }> = []
    const desires: Array<{ text: string; avatars: string[] }> = []
    const objections: Array<{ text: string; avatars: string[] }> = []

    // Filter by selected avatar if one is chosen
    const filteredAvatars = selectedAvatarId
      ? avatarsResearch.filter(a => a.id === selectedAvatarId)
      : avatarsResearch

    filteredAvatars.forEach(avatar => {
      avatar.painPoints.forEach(point => {
        const existing = painPoints.find(p => p.text.toLowerCase() === point.toLowerCase())
        if (existing) {
          if (!existing.avatars.includes(avatar.name)) existing.avatars.push(avatar.name)
        } else {
          painPoints.push({ text: point, avatars: [avatar.name] })
        }
      })

      avatar.desires.forEach(desire => {
        const existing = desires.find(d => d.text.toLowerCase() === desire.toLowerCase())
        if (existing) {
          if (!existing.avatars.includes(avatar.name)) existing.avatars.push(avatar.name)
        } else {
          desires.push({ text: desire, avatars: [avatar.name] })
        }
      })

      avatar.objections.forEach(objection => {
        const existing = objections.find(o => o.text.toLowerCase() === objection.toLowerCase())
        if (existing) {
          if (!existing.avatars.includes(avatar.name)) existing.avatars.push(avatar.name)
        } else {
          objections.push({ text: objection, avatars: [avatar.name] })
        }
      })
    })

    // Filter by search
    const search = researchSearch.toLowerCase()
    return {
      painPoints: painPoints.filter(p => p.text.toLowerCase().includes(search)),
      desires: desires.filter(d => d.text.toLowerCase().includes(search)),
      objections: objections.filter(o => o.text.toLowerCase().includes(search)),
    }
  }

  const researchItems = getAllResearchItems()

  const handleUseAsAngle = (text: string, type: 'pain' | 'desire' | 'objection') => {
    const angleTypeMap: Record<string, string> = { pain: 'fear', desire: 'desire', objection: 'curiosity' }
    setFormData(prev => ({
      ...prev,
      angleType: angleTypeMap[type] || prev.angleType,
      angleDetail: text
    }))
  }

  const handleAddToHypothesis = (text: string) => {
    setFormData(prev => ({
      ...prev,
      hypothesis: prev.hypothesis ? `${prev.hypothesis}\n\n${text}` : text
    }))
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const validate = (targetStatus: string): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.concept.trim()) {
      newErrors.concept = 'El concepto es obligatorio'
    }

    // Only require hypothesis for non-ideas
    if (targetStatus !== 'idea' && !formData.hypothesis.trim()) {
      newErrors.hypothesis = 'La hipotesis es obligatoria para produccion'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (targetStatus: string) => {
    if (!validate(targetStatus)) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: generatedName,
          status: targetStatus,
          testingBudget: parseFloat(formData.testingBudget) || 50,
          dueDate: formData.dueDate || null,
          avatarId: formData.avatarId || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al crear el anuncio')
      }

      router.push('/board')
      router.refresh()
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Error al crear el anuncio' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Main Form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Nuevo Anuncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Avatar Selector */}
        <div className="space-y-2">
          <Label htmlFor="avatar">
            Avatar <span className="text-muted-foreground text-xs">(filtra el research por avatar)</span>
          </Label>
          <Select
            id="avatar"
            options={[
              { value: '', label: 'Todos los avatars' },
              ...avatarsResearch.map(a => ({ value: a.id, label: a.name }))
            ]}
            value={selectedAvatarId}
            onChange={(e) => {
              setSelectedAvatarId(e.target.value)
              setSelectedSubAvatarId('')
              handleChange('avatarId', e.target.value)
            }}
          />
        </div>

        {/* Sub-Avatar Selector (shows when avatar is selected and has sub-avatars) */}
        {selectedAvatarId && subAvatars.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              Sub-Avatar <span className="text-muted-foreground text-xs">(momento/estado)</span>
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {subAvatars.map((subAvatar) => {
                const isSelected = selectedSubAvatarId === subAvatar.id
                const awarenessLabel = AWARENESS_LEVELS.find(a => a.value === subAvatar.awareness)?.label

                return (
                  <div
                    key={subAvatar.id}
                    onClick={() => handleSubAvatarSelect(isSelected ? '' : subAvatar.id)}
                    className={`
                      p-3 rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                        : 'border-muted hover:border-purple-300 dark:hover:border-purple-700'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{subAvatar.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {awarenessLabel}
                          </Badge>
                        </div>
                        <div className="text-xs space-y-0.5">
                          <p className="text-red-600 dark:text-red-400 truncate">
                            <Target className="h-3 w-3 inline mr-1" />
                            {subAvatar.painPoint}
                          </p>
                          <p className="text-amber-600 dark:text-amber-400 truncate">
                            <Sparkles className="h-3 w-3 inline mr-1" />
                            {subAvatar.desire}
                          </p>
                          {subAvatar.trigger && (
                            <p className="text-yellow-600 dark:text-yellow-400 truncate">
                              <Zap className="h-3 w-3 inline mr-1" />
                              {subAvatar.trigger}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-purple-500 ml-2">✓</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selecciona un sub-avatar para auto-llenar el detalle del ángulo y nivel de conciencia
            </p>
          </div>
        )}

        {/* Generated Name Preview */}
        {generatedName && (
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-xs text-muted-foreground">Nombre Auto-generado</Label>
            <p className="font-mono text-sm mt-1">{generatedName}</p>
          </div>
        )}

        {/* Concept */}
        <div className="space-y-2">
          <Label htmlFor="concept">
            Concepto* <span className="text-muted-foreground text-xs">(3-4 palabras)</span>
          </Label>
          <Input
            id="concept"
            placeholder="Ej: Ahorro de dinero"
            value={formData.concept}
            onChange={(e) => handleChange('concept', e.target.value)}
            className={errors.concept ? 'border-red-500' : ''}
          />
          {errors.concept && <p className="text-red-500 text-xs">{errors.concept}</p>}
        </div>

        {/* Angle Type + Awareness (2 columns) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="angleType">Tipo de Angulo*</Label>
            <Select
              id="angleType"
              options={ANGLES}
              value={formData.angleType}
              onChange={(e) => handleChange('angleType', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="awareness">Nivel de Conciencia*</Label>
            <Select
              id="awareness"
              options={AWARENESS_LEVELS}
              value={formData.awareness}
              onChange={(e) => handleChange('awareness', e.target.value)}
            />
          </div>
        </div>

        {/* Angle Detail (optional) */}
        <div className="space-y-2">
          <Label htmlFor="angleDetail">
            Detalle del Angulo <span className="text-muted-foreground text-xs">(opcional - del research)</span>
          </Label>
          <Input
            id="angleDetail"
            placeholder="Ej: Miedo a no poder jugar con sus hijos por falta de energía"
            value={formData.angleDetail}
            onChange={(e) => handleChange('angleDetail', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Tip: Selecciona un pain point o deseo del panel de Research para usarlo como detalle
          </p>
        </div>

        {/* Hypothesis */}
        <div className="space-y-2">
          <Label htmlFor="hypothesis">
            Hipotesis <span className="text-muted-foreground text-xs">(obligatoria para produccion)</span>
          </Label>
          <Textarea
            id="hypothesis"
            placeholder="Creo que funcionara porque..."
            value={formData.hypothesis}
            onChange={(e) => handleChange('hypothesis', e.target.value)}
            className={errors.hypothesis ? 'border-red-500' : ''}
            rows={3}
          />
          {errors.hypothesis && <p className="text-red-500 text-xs">{errors.hypothesis}</p>}
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label htmlFor="format">Formato*</Label>
          <Select
            id="format"
            options={FORMATS}
            value={formData.format}
            onChange={(e) => handleChange('format', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="funnelStage">Etapa del Funnel*</Label>
            <Select
              id="funnelStage"
              options={FUNNEL_STAGES}
              value={formData.funnelStage}
              onChange={(e) => handleChange('funnelStage', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product">Producto (opcional)</Label>
            <Input
              id="product"
              placeholder="Nombre del producto"
              value={formData.product}
              onChange={(e) => handleChange('product', e.target.value)}
            />
          </div>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <Label>Fuente</Label>
          <div className="flex gap-4">
            {SOURCE_TYPES.map((source) => (
              <label key={source.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sourceType"
                  value={source.value}
                  checked={formData.sourceType === source.value}
                  onChange={(e) => handleChange('sourceType', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{source.label}</span>
              </label>
            ))}
          </div>
        </div>

        {formData.sourceType !== 'original' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">URL de Referencia (opcional)</Label>
              <Input
                id="sourceUrl"
                type="url"
                placeholder="https://..."
                value={formData.sourceUrl}
                onChange={(e) => handleChange('sourceUrl', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Video/Imagen de Referencia</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Sube el video o imagen del anuncio de la competencia para tenerlo como referencia
              </p>
              <FileUpload
                value={formData.referenceMediaUrl || undefined}
                onChange={(url) => handleChange('referenceMediaUrl', url || '')}
                accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/gif,image/webp"
                maxSize={100}
              />
            </div>
          </>
        )}

        {/* Due Date and Testing Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dueDate">
              Fecha Limite <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              min={getLocalDateString()}
            />
            <p className="text-xs text-muted-foreground">
              Ponte una fecha para forzarte a completarlo
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="testingBudget">Presupuesto de Testeo ($)</Label>
            <Input
              id="testingBudget"
              type="number"
              min="0"
              step="10"
              value={formData.testingBudget}
              onChange={(e) => handleChange('testingBudget', e.target.value)}
            />
          </div>
        </div>

        {/* Thumbnail URL */}
        <div className="space-y-2">
          <Label htmlFor="thumbnailUrl">URL de Thumbnail (opcional)</Label>
          <Input
            id="thumbnailUrl"
            type="url"
            placeholder="https://..."
            value={formData.thumbnailUrl}
            onChange={(e) => handleChange('thumbnailUrl', e.target.value)}
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('idea')}
            disabled={isSubmitting}
            className="flex-1"
          >
            Crear en Ideas
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('production')}
            disabled={isSubmitting}
            className="flex-1"
          >
            Crear en Produccion
          </Button>
        </div>
      </CardContent>
    </Card>

      {/* Sidebar with Tabs */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-3">
          {/* Tab Buttons */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab('research')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'research'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Research
            </button>
            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'copilot'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Copilot
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
            {activeTab === 'research' ? (
              <Card>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar en research..."
                      value={researchSearch}
                      onChange={(e) => setResearchSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-4">
                  {avatarsResearch.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay avatars con research.
                      <br />
                      <a href="/avatars" className="text-blue-500 hover:underline">
                        Crear avatars primero
                      </a>
                    </p>
                  ) : (
                    <>
                      {/* Pain Points Section */}
                      <div>
                        <button
                          onClick={() => toggleSection('painPoints')}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-semibold">Pain Points</span>
                            <Badge variant="secondary" className="text-xs">
                              {researchItems.painPoints.length}
                            </Badge>
                          </div>
                          {expandedSections.painPoints ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedSections.painPoints && (
                          <div className="mt-2 space-y-2">
                            {researchItems.painPoints.length === 0 ? (
                              <p className="text-xs text-muted-foreground pl-6">No hay pain points</p>
                            ) : (
                              researchItems.painPoints.map((item, i) => (
                                <ResearchItem
                                  key={i}
                                  text={item.text}
                                  avatars={item.avatars}
                                  onUseAsAngle={() => handleUseAsAngle(item.text, 'pain')}
                                  onAddToHypothesis={() => handleAddToHypothesis(item.text)}
                                  type="pain"
                                />
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Desires Section */}
                      <div>
                        <button
                          onClick={() => toggleSection('desires')}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold">Deseos</span>
                            <Badge variant="secondary" className="text-xs">
                              {researchItems.desires.length}
                            </Badge>
                          </div>
                          {expandedSections.desires ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedSections.desires && (
                          <div className="mt-2 space-y-2">
                            {researchItems.desires.length === 0 ? (
                              <p className="text-xs text-muted-foreground pl-6">No hay deseos</p>
                            ) : (
                              researchItems.desires.map((item, i) => (
                                <ResearchItem
                                  key={i}
                                  text={item.text}
                                  avatars={item.avatars}
                                  onUseAsAngle={() => handleUseAsAngle(item.text, 'desire')}
                                  onAddToHypothesis={() => handleAddToHypothesis(item.text)}
                                  type="desire"
                                />
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Objections Section */}
                      <div>
                        <button
                          onClick={() => toggleSection('objections')}
                          className="flex items-center justify-between w-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <Ban className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-semibold">Objeciones</span>
                            <Badge variant="secondary" className="text-xs">
                              {researchItems.objections.length}
                            </Badge>
                          </div>
                          {expandedSections.objections ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {expandedSections.objections && (
                          <div className="mt-2 space-y-2">
                            {researchItems.objections.length === 0 ? (
                              <p className="text-xs text-muted-foreground pl-6">No hay objeciones</p>
                            ) : (
                              researchItems.objections.map((item, i) => (
                                <ResearchItem
                                  key={i}
                                  text={item.text}
                                  avatars={item.avatars}
                                  onUseAsAngle={() => handleUseAsAngle(item.text, 'objection')}
                                  onAddToHypothesis={() => handleAddToHypothesis(item.text)}
                                  type="objection"
                                />
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <CopilotSidebar
                angleType={formData.angleType}
                awareness={formData.awareness}
                avatarId={selectedAvatarId}
                format={formData.format}
                concept={formData.concept}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Research Item Component
function ResearchItem({
  text,
  avatars,
  onUseAsAngle,
  onAddToHypothesis,
  type,
}: {
  text: string
  avatars: string[]
  onUseAsAngle: () => void
  onAddToHypothesis: () => void
  type: 'pain' | 'desire' | 'objection'
}) {
  const bgColor = type === 'pain'
    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
    : type === 'desire'
    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
    : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'

  return (
    <div className={`p-2 rounded-lg border ${bgColor}`}>
      <p className="text-sm mb-2">{text}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {avatars.map((avatar, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="text-[10px] px-1.5 py-0"
            >
              {avatar}
            </Badge>
          ))}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUseAsAngle()
            }}
            className="text-[10px] px-2 py-1 bg-background hover:bg-muted rounded border transition-colors"
            title="Usar como ángulo"
          >
            → Ángulo
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToHypothesis()
            }}
            className="text-[10px] px-2 py-1 bg-background hover:bg-muted rounded border transition-colors"
            title="Agregar a hipótesis"
          >
            + Hipótesis
          </button>
        </div>
      </div>
    </div>
  )
}
