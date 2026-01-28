"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ACTIONS, FAIL_REASONS, SUCCESS_FACTORS } from '@/lib/constants'
import { calculateROAS, analyzeVideoMetrics, formatPercentage } from '@/lib/utils'
import { Trophy, Skull, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle, Video } from 'lucide-react'

const ELEMENTS = [
  { key: 'hook', label: 'Hook', description: 'Primeros 3 segundos', placeholder: 'Ej: "¿Sigues pagando precio completo?" - funciono porque genera curiosidad' },
  { key: 'avatar', label: 'Avatar/Presentador', description: 'Persona o cara del anuncio', placeholder: 'Ej: Mujer joven, tono casual, fondo neutro' },
  { key: 'script', label: 'Guion/Copy', description: 'Mensaje y estructura', placeholder: 'Ej: La estructura problema-solucion funciono bien' },
  { key: 'cta', label: 'CTA', description: 'Llamada a la accion', placeholder: 'Ej: "Compra ahora con 50% OFF" - urgencia + descuento' },
  { key: 'visual', label: 'Visual/Estetica', description: 'Colores, estilo, edicion', placeholder: 'Ej: Fondo negro con texto amarillo, muy contrastante' },
  { key: 'audio', label: 'Audio/Musica', description: 'Sonido y musica de fondo', placeholder: 'Ej: Musica trending de TikTok, energetica' },
] as const

interface Ad {
  id: string
  name: string
  concept: string
  angle: string
  format: string
  hypothesis: string
  thumbnailUrl: string | null
  spend: number | null
  impressions: number | null
  clicks: number | null
  purchases: number | null
  revenue: number | null
  videoViewThreeSeconds: number | null
  videoViewThruplay: number | null
}

interface PostMortemFormProps {
  ad: Ad
}

export function PostMortemForm({ ad }: PostMortemFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    spend: ad.spend?.toString() || '',
    impressions: ad.impressions?.toString() || '',
    clicks: ad.clicks?.toString() || '',
    purchases: ad.purchases?.toString() || '',
    revenue: ad.revenue?.toString() || '',
    // Video metrics
    videoViewThreeSeconds: ad.videoViewThreeSeconds?.toString() || '',
    videoViewThruplay: ad.videoViewThruplay?.toString() || '',
    result: '' as 'winner' | 'loser' | '',
    diagnosis: '',
    action: 'iterate',
    saveLearning: true,
    // Element evaluations - result + note
    hookResult: '' as 'worked' | 'failed' | '',
    hookNote: '',
    avatarResult: '' as 'worked' | 'failed' | '',
    avatarNote: '',
    scriptResult: '' as 'worked' | 'failed' | '',
    scriptNote: '',
    ctaResult: '' as 'worked' | 'failed' | '',
    ctaNote: '',
    visualResult: '' as 'worked' | 'failed' | '',
    visualNote: '',
    audioResult: '' as 'worked' | 'failed' | '',
    audioNote: '',
    // Etiquetas de fallo/éxito
    failReasons: [] as string[],
    successFactors: [] as string[],
  })

  const calculatedROAS = calculateROAS(
    parseFloat(formData.revenue) || null,
    parseFloat(formData.spend) || null
  )

  // Video metrics calculation
  const isVideoFormat = ad.format === 'video' || ad.format === 'ugc'
  const videoMetrics = analyzeVideoMetrics(
    parseInt(formData.impressions) || null,
    parseInt(formData.videoViewThreeSeconds) || null,
    parseInt(formData.videoViewThruplay) || null
  )

  // Auto-apply suggested results when video metrics change
  const applyVideoSuggestions = () => {
    const updates: Partial<typeof formData> = {}

    if (videoMetrics.suggestedHookResult && !formData.hookResult) {
      updates.hookResult = videoMetrics.suggestedHookResult
      if (videoMetrics.suggestedHookResult === 'failed') {
        updates.hookNote = `Hook Rate: ${formatPercentage(videoMetrics.hookRate)} (< 20% = hook debil)`
      }
    }

    if (videoMetrics.suggestedScriptResult && !formData.scriptResult) {
      updates.scriptResult = videoMetrics.suggestedScriptResult
      if (videoMetrics.suggestedScriptResult === 'failed') {
        updates.scriptNote = `Hold Rate: ${formatPercentage(videoMetrics.holdRate)} (< 15% = guion aburrido)`
      }
    }

    if (Object.keys(updates).length > 0) {
      setFormData(prev => ({ ...prev, ...updates }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.result) {
      newErrors.result = 'Selecciona si es Winner o Loser'
    }

    if (!formData.diagnosis.trim()) {
      newErrors.diagnosis = 'El diagnostico es obligatorio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spend: parseFloat(formData.spend) || null,
          impressions: parseInt(formData.impressions) || null,
          clicks: parseInt(formData.clicks) || null,
          purchases: parseInt(formData.purchases) || null,
          revenue: parseFloat(formData.revenue) || null,
          videoViewThreeSeconds: parseInt(formData.videoViewThreeSeconds) || null,
          videoViewThruplay: parseInt(formData.videoViewThruplay) || null,
          result: formData.result,
          diagnosis: formData.diagnosis,
          action: formData.action,
          status: 'completed',
          closedAt: new Date().toISOString(),
          saveLearning: formData.saveLearning,
          // Element evaluations
          hookResult: formData.hookResult || null,
          hookNote: formData.hookNote || null,
          avatarResult: formData.avatarResult || null,
          avatarNote: formData.avatarNote || null,
          scriptResult: formData.scriptResult || null,
          scriptNote: formData.scriptNote || null,
          ctaResult: formData.ctaResult || null,
          ctaNote: formData.ctaNote || null,
          visualResult: formData.visualResult || null,
          visualNote: formData.visualNote || null,
          audioResult: formData.audioResult || null,
          audioNote: formData.audioNote || null,
          // Tags
          failReasons: formData.failReasons.length > 0 ? JSON.stringify(formData.failReasons) : null,
          successFactors: formData.successFactors.length > 0 ? JSON.stringify(formData.successFactors) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar el analisis')
      }

      router.push('/board')
      router.refresh()
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Error al guardar' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleTag = (field: 'failReasons' | 'successFactors', tag: string) => {
    setFormData(prev => {
      const current = prev[field]
      const updated = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag]
      return { ...prev, [field]: updated }
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Analisis: {ad.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Thumbnail & Hypothesis */}
        <div className="flex gap-4">
          <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            {ad.thumbnailUrl ? (
              <img src={ad.thumbnailUrl} alt={ad.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-muted-foreground text-xs">Sin imagen</span>
            )}
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground">Hipotesis original</Label>
            <p className="text-sm mt-1 italic">&quot;{ad.hypothesis}&quot;</p>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Metricas (de Meta Ads)</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="spend" className="text-xs">Gasto ($)</Label>
              <Input
                id="spend"
                type="number"
                step="0.01"
                value={formData.spend}
                onChange={(e) => handleChange('spend', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="impressions" className="text-xs">Impresiones</Label>
              <Input
                id="impressions"
                type="number"
                value={formData.impressions}
                onChange={(e) => handleChange('impressions', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="clicks" className="text-xs">Clicks</Label>
              <Input
                id="clicks"
                type="number"
                value={formData.clicks}
                onChange={(e) => handleChange('clicks', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="purchases" className="text-xs">Compras</Label>
              <Input
                id="purchases"
                type="number"
                value={formData.purchases}
                onChange={(e) => handleChange('purchases', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="revenue" className="text-xs">Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                value={formData.revenue}
                onChange={(e) => handleChange('revenue', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ROAS Calculado</Label>
              <div className="h-9 flex items-center px-3 bg-muted rounded-md font-mono">
                {calculatedROAS ? `${calculatedROAS.toFixed(2)}x` : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Video Metrics - Only show for video/ugc formats */}
        {isVideoFormat && (
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Video className="h-4 w-4" />
              Metricas de Video
              <span className="text-xs text-muted-foreground font-normal">(para diagnostico automatico)</span>
            </Label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="videoViewThreeSeconds" className="text-xs">Vistas 3 seg</Label>
                <Input
                  id="videoViewThreeSeconds"
                  type="number"
                  placeholder="Ej: 5000"
                  value={formData.videoViewThreeSeconds}
                  onChange={(e) => handleChange('videoViewThreeSeconds', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="videoViewThruplay" className="text-xs">Thruplays (completas)</Label>
                <Input
                  id="videoViewThruplay"
                  type="number"
                  placeholder="Ej: 800"
                  value={formData.videoViewThruplay}
                  onChange={(e) => handleChange('videoViewThruplay', e.target.value)}
                />
              </div>
            </div>

            {/* Calculated Rates Display */}
            {(videoMetrics.hookRate !== null || videoMetrics.holdRate !== null) && (
              <div className="grid grid-cols-2 gap-3">
                {/* Hook Rate */}
                <div className={`p-3 rounded-lg border ${
                  videoMetrics.hookRateStatus === 'failed'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                    : videoMetrics.hookRateStatus === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : videoMetrics.hookRateStatus === 'good'
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800'
                    : 'bg-muted border-transparent'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Hook Rate</span>
                    {videoMetrics.hookRateStatus === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {videoMetrics.hookRateStatus === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-lg font-bold">{formatPercentage(videoMetrics.hookRate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {videoMetrics.hookRateStatus === 'failed' && '< 20% = Hook debil'}
                    {videoMetrics.hookRateStatus === 'warning' && '20-30% = Mejorable'}
                    {videoMetrics.hookRateStatus === 'good' && '> 30% = Hook fuerte'}
                  </p>
                </div>

                {/* Hold Rate */}
                <div className={`p-3 rounded-lg border ${
                  videoMetrics.holdRateStatus === 'failed'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                    : videoMetrics.holdRateStatus === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : videoMetrics.holdRateStatus === 'good'
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800'
                    : 'bg-muted border-transparent'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">Hold Rate</span>
                    {videoMetrics.holdRateStatus === 'failed' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {videoMetrics.holdRateStatus === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                  <p className="text-lg font-bold">{formatPercentage(videoMetrics.holdRate)}</p>
                  <p className="text-xs text-muted-foreground">
                    {videoMetrics.holdRateStatus === 'failed' && '< 15% = Guion aburrido'}
                    {videoMetrics.holdRateStatus === 'warning' && '15-25% = Mejorable'}
                    {videoMetrics.holdRateStatus === 'good' && '> 25% = Guion retiene'}
                  </p>
                </div>
              </div>
            )}

            {/* Auto-apply suggestions button */}
            {(videoMetrics.suggestedHookResult || videoMetrics.suggestedScriptResult) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyVideoSuggestions}
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Aplicar diagnostico automatico basado en metricas
              </Button>
            )}
          </div>
        )}

        {/* Result Selection */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Resultado*</Label>
          <div className="flex gap-3">
            <Button
              type="button"
              variant={formData.result === 'winner' ? 'winner' : 'outline'}
              className="flex-1 h-16"
              onClick={() => handleChange('result', 'winner')}
            >
              <Trophy className="mr-2 h-5 w-5" />
              WINNER
            </Button>
            <Button
              type="button"
              variant={formData.result === 'loser' ? 'loser' : 'outline'}
              className="flex-1 h-16"
              onClick={() => handleChange('result', 'loser')}
            >
              <Skull className="mr-2 h-5 w-5" />
              LOSER
            </Button>
          </div>
          {errors.result && <p className="text-red-500 text-xs">{errors.result}</p>}
        </div>

        {/* Success/Fail Tags */}
        {formData.result && (
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              {formData.result === 'winner' ? 'Factores de Éxito' : 'Razones del Fallo'}
              <span className="text-muted-foreground text-xs font-normal ml-2">(selecciona todos los que apliquen)</span>
            </Label>

            {formData.result === 'loser' && (
              <div className="flex flex-wrap gap-2">
                {FAIL_REASONS.map((reason) => (
                  <button
                    key={reason.value}
                    type="button"
                    onClick={() => toggleTag('failReasons', reason.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.failReasons.includes(reason.value)
                        ? 'bg-red-500 text-white'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    }`}
                  >
                    {reason.icon} {reason.label}
                  </button>
                ))}
              </div>
            )}

            {formData.result === 'winner' && (
              <div className="flex flex-wrap gap-2">
                {SUCCESS_FACTORS.map((factor) => (
                  <button
                    key={factor.value}
                    type="button"
                    onClick={() => toggleTag('successFactors', factor.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      formData.successFactors.includes(factor.value)
                        ? 'bg-green-500 text-white'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                    }`}
                  >
                    {factor.icon} {factor.label}
                  </button>
                ))}
              </div>
            )}

            {/* Also allow adding opposite tags for nuance */}
            {formData.result === 'winner' && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">¿Algo que NO funciono aunque gano?</p>
                <div className="flex flex-wrap gap-2">
                  {FAIL_REASONS.slice(0, 5).map((reason) => (
                    <button
                      key={reason.value}
                      type="button"
                      onClick={() => toggleTag('failReasons', reason.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        formData.failReasons.includes(reason.value)
                          ? 'bg-red-500 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-red-100 dark:hover:bg-red-900/30'
                      }`}
                    >
                      {reason.icon} {reason.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.result === 'loser' && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-2">¿Algo que SI funciono aunque perdio?</p>
                <div className="flex flex-wrap gap-2">
                  {SUCCESS_FACTORS.slice(0, 5).map((factor) => (
                    <button
                      key={factor.value}
                      type="button"
                      onClick={() => toggleTag('successFactors', factor.value)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        formData.successFactors.includes(factor.value)
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-green-100 dark:hover:bg-green-900/30'
                      }`}
                    >
                      {factor.icon} {factor.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Element Evaluation */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            Evaluacion por Elementos <span className="text-muted-foreground text-xs font-normal">(guarda exactamente que funciono o fallo)</span>
          </Label>
          <div className="grid gap-3">
            {ELEMENTS.map((element) => {
              const resultKey = `${element.key}Result` as keyof typeof formData
              const noteKey = `${element.key}Note` as keyof typeof formData
              const resultValue = formData[resultKey]
              const noteValue = formData[noteKey] as string

              return (
                <div
                  key={element.key}
                  className={`p-3 rounded-lg border transition-colors ${
                    resultValue === 'worked'
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800'
                      : resultValue === 'failed'
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'
                      : 'bg-muted/50 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{element.label}</p>
                      <p className="text-xs text-muted-foreground">{element.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={resultValue === 'worked' ? 'default' : 'ghost'}
                        className={resultValue === 'worked' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => handleChange(resultKey, resultValue === 'worked' ? '' : 'worked')}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={resultValue === 'failed' ? 'default' : 'ghost'}
                        className={resultValue === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
                        onClick={() => handleChange(resultKey, resultValue === 'failed' ? '' : 'failed')}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {resultValue && (
                    <Textarea
                      placeholder={element.placeholder}
                      value={noteValue}
                      onChange={(e) => handleChange(noteKey, e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Diagnosis */}
        <div className="space-y-2">
          <Label htmlFor="diagnosis">
            Diagnostico* <span className="text-muted-foreground text-xs">(Por que gano/perdio?)</span>
          </Label>
          <Textarea
            id="diagnosis"
            placeholder="Analiza por que este anuncio tuvo este resultado..."
            value={formData.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
            className={errors.diagnosis ? 'border-red-500' : ''}
            rows={4}
          />
          {errors.diagnosis && <p className="text-red-500 text-xs">{errors.diagnosis}</p>}
        </div>

        {/* Action */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Accion</Label>
          <div className="flex flex-col gap-2">
            {ACTIONS.map((action) => (
              <label key={action.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="action"
                  value={action.value}
                  checked={formData.action === action.value}
                  onChange={(e) => handleChange('action', e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{action.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Save Learning */}
        <label className="flex items-center gap-2 cursor-pointer p-3 bg-muted rounded-lg">
          <input
            type="checkbox"
            checked={formData.saveLearning}
            onChange={(e) => handleChange('saveLearning', e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Guardar diagnostico como Aprendizaje en la Libreria</span>
        </label>

        {/* Error Message */}
        {errors.submit && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Guardando...' : 'Completar Analisis'}
        </Button>
      </CardContent>
    </Card>
  )
}
