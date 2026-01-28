"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUpload } from '@/components/ui/file-upload'
import { ANGLES, FORMATS, FUNNEL_STAGES, SOURCE_TYPES } from '@/lib/constants'
import { generateAdName } from '@/lib/name-generator'

export function AdForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    concept: '',
    hypothesis: '',
    angle: 'fear',
    format: 'static',
    funnelStage: 'cold',
    product: '',
    sourceType: 'original',
    sourceUrl: '',
    referenceMediaUrl: '',
    testingBudget: '50',
    thumbnailUrl: '',
    dueDate: '',
  })

  const [generatedName, setGeneratedName] = useState('')

  useEffect(() => {
    if (formData.concept && formData.angle && formData.format) {
      const name = generateAdName(
        formData.concept,
        formData.angle as 'fear' | 'desire' | 'curiosity' | 'offer' | 'tutorial' | 'testimonial',
        formData.format as 'static' | 'video' | 'ugc' | 'carousel'
      )
      setGeneratedName(name)
    } else {
      setGeneratedName('')
    }
  }, [formData.concept, formData.angle, formData.format])

  const validate = (targetStatus: string): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.concept.trim()) {
      newErrors.concept = 'El concepto es obligatorio'
    }

    if (!formData.hypothesis.trim()) {
      newErrors.hypothesis = 'La hipotesis es obligatoria'
    }

    // For production, hypothesis is strictly required
    if (targetStatus === 'production' && !formData.hypothesis.trim()) {
      newErrors.hypothesis = 'La hipotesis es obligatoria para mover a produccion'
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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nuevo Anuncio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Hypothesis */}
        <div className="space-y-2">
          <Label htmlFor="hypothesis">
            Hipotesis* <span className="text-muted-foreground text-xs">(Por que funcionara?)</span>
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

        {/* Selects Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="angle">Angulo*</Label>
            <Select
              id="angle"
              options={ANGLES}
              value={formData.angle}
              onChange={(e) => handleChange('angle', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Formato*</Label>
            <Select
              id="format"
              options={FORMATS}
              value={formData.format}
              onChange={(e) => handleChange('format', e.target.value)}
            />
          </div>
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
              min={new Date().toISOString().split('T')[0]}
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
  )
}
