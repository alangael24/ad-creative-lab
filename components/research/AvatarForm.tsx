"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ORGANIC_STYLES } from '@/lib/constants'
import { Plus, X, Loader2, Target, Sparkles, Ban, MessageSquare, Tv } from 'lucide-react'

interface AvatarFormProps {
  avatar?: {
    id: string
    name: string
    description: string | null
    painPoints: string
    desires: string
    objections: string | null
    organicStyle: string | null
    language: string | null
    ageRange: string | null
    gender: string | null
    location: string | null
  }
}

export function AvatarForm({ avatar }: AvatarFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Parse JSON arrays from avatar
  const initialPainPoints = avatar?.painPoints ? JSON.parse(avatar.painPoints) as string[] : ['']
  const initialDesires = avatar?.desires ? JSON.parse(avatar.desires) as string[] : ['']
  const initialObjections = avatar?.objections ? JSON.parse(avatar.objections) as string[] : []

  const [formData, setFormData] = useState({
    name: avatar?.name || '',
    description: avatar?.description || '',
    organicStyle: avatar?.organicStyle || '',
    language: avatar?.language || '',
    ageRange: avatar?.ageRange || '',
    gender: avatar?.gender || '',
    location: avatar?.location || '',
  })

  const [painPoints, setPainPoints] = useState<string[]>(initialPainPoints)
  const [desires, setDesires] = useState<string[]>(initialDesires)
  const [objections, setObjections] = useState<string[]>(initialObjections)

  const addPainPoint = () => setPainPoints([...painPoints, ''])
  const addDesire = () => setDesires([...desires, ''])
  const addObjection = () => setObjections([...objections, ''])

  const removePainPoint = (index: number) => {
    if (painPoints.length > 1) {
      setPainPoints(painPoints.filter((_, i) => i !== index))
    }
  }
  const removeDesire = (index: number) => {
    if (desires.length > 1) {
      setDesires(desires.filter((_, i) => i !== index))
    }
  }
  const removeObjection = (index: number) => {
    setObjections(objections.filter((_, i) => i !== index))
  }

  const updatePainPoint = (index: number, value: string) => {
    const updated = [...painPoints]
    updated[index] = value
    setPainPoints(updated)
  }
  const updateDesire = (index: number, value: string) => {
    const updated = [...desires]
    updated[index] = value
    setDesires(updated)
  }
  const updateObjection = (index: number, value: string) => {
    const updated = [...objections]
    updated[index] = value
    setObjections(updated)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio'
    }

    const filledPainPoints = painPoints.filter(p => p.trim())
    if (filledPainPoints.length === 0) {
      newErrors.painPoints = 'Agrega al menos un pain point específico'
    }

    const filledDesires = desires.filter(d => d.trim())
    if (filledDesires.length === 0) {
      newErrors.desires = 'Agrega al menos un deseo específico'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const url = avatar ? `/api/avatars/${avatar.id}` : '/api/avatars'
      const method = avatar ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          painPoints: JSON.stringify(painPoints.filter(p => p.trim())),
          desires: JSON.stringify(desires.filter(d => d.trim())),
          objections: objections.filter(o => o.trim()).length > 0
            ? JSON.stringify(objections.filter(o => o.trim()))
            : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar')
      }

      const data = await response.json()
      router.push(`/research/avatars/${data.id}`)
      router.refresh()
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : 'Error al guardar' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Avatar*</Label>
            <Input
              id="name"
              placeholder="Ej: Madres primerizas estresadas"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            <p className="text-xs text-muted-foreground">
              Sé específico. No &quot;mujeres 25-45&quot;, sino &quot;madres primerizas que trabajan desde casa&quot;
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Contexto adicional sobre este avatar..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ageRange">Rango de edad</Label>
              <Input
                id="ageRange"
                placeholder="Ej: 28-42"
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Género</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="">Seleccionar...</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="all">Ambos</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ej: LATAM, España"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pain Points */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader className="bg-red-50 dark:bg-red-950/30">
          <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <Target className="h-5 w-5" />
            Luchas Diarias (Pain Points)*
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            NO pongas &quot;quiere bajar de peso&quot;. Pon el escenario específico: &quot;Le da vergüenza ir a la piscina con sus hijos&quot;
          </p>
          {painPoints.map((point, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                placeholder="Describe una situación específica que vive este avatar..."
                value={point}
                onChange={(e) => updatePainPoint(index, e.target.value)}
                rows={2}
                className="flex-1"
              />
              {painPoints.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePainPoint(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.painPoints && <p className="text-red-500 text-xs">{errors.painPoints}</p>}
          <Button type="button" variant="outline" size="sm" onClick={addPainPoint}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar Pain Point
          </Button>
        </CardContent>
      </Card>

      {/* Desires */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="bg-green-50 dark:bg-green-950/30">
          <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
            <Sparkles className="h-5 w-5" />
            Deseos y Aspiraciones*
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Qué quieren lograr realmente? No &quot;estar sano&quot;, sino &quot;tener energía para jugar con sus hijos sin cansarse&quot;
          </p>
          {desires.map((desire, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                placeholder="Describe un deseo específico de este avatar..."
                value={desire}
                onChange={(e) => updateDesire(index, e.target.value)}
                rows={2}
                className="flex-1"
              />
              {desires.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeDesire(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {errors.desires && <p className="text-red-500 text-xs">{errors.desires}</p>}
          <Button type="button" variant="outline" size="sm" onClick={addDesire}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar Deseo
          </Button>
        </CardContent>
      </Card>

      {/* Objections */}
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="bg-amber-50 dark:bg-amber-950/30">
          <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Ban className="h-5 w-5" />
            Objeciones Comunes (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Por qué NO comprarían? &quot;No tengo tiempo&quot;, &quot;Ya probé todo y nada funciona&quot;
          </p>
          {objections.map((objection, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Una objeción común..."
                value={objection}
                onChange={(e) => updateObjection(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeObjection(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addObjection}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar Objeción
          </Button>
        </CardContent>
      </Card>

      {/* Organic Style */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Tv className="h-5 w-5" />
            Estilo de Contenido Orgánico
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            ¿Qué ve este avatar cuando NO está viendo anuncios? Esto te dice qué formato usar.
          </p>

          <div className="flex flex-wrap gap-2">
            {ORGANIC_STYLES.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => setFormData({ ...formData, organicStyle: style.value })}
                className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                  formData.organicStyle === style.value
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-muted border-transparent hover:border-blue-300'
                }`}
              >
                <span className="font-medium">{style.label}</span>
                <span className="block text-xs opacity-75">{style.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <MessageSquare className="h-5 w-5" />
            Lenguaje del Avatar
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Cómo hablan del problema? Copia frases textuales de Reddit, TikTok, etc.
          </p>
          <Textarea
            placeholder="Ej: 'Es que me da cosa...', 'Ya no sé qué hacer', 'Mi esposo no entiende que...'"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Error Message */}
      {errors.submit && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            avatar ? 'Actualizar Avatar' : 'Crear Avatar'
          )}
        </Button>
      </div>
    </div>
  )
}
