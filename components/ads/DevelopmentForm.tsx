"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Save, Loader2 } from 'lucide-react'

interface Ad {
  id: string
  name: string
  concept: string
  hook: string | null
  script: string | null
  cta: string | null
  notes: string | null
}

interface DevelopmentFormProps {
  ad: Ad
}

export function DevelopmentForm({ ad }: DevelopmentFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    hook: ad.hook || '',
    script: ad.script || '',
    cta: ad.cta || '',
    notes: ad.notes || '',
  })

  const handleSave = async () => {
    setIsSaving(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/ads/${ad.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Error al guardar')
      }

      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Desarrollo Creativo</span>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {saved ? 'Guardado!' : 'Guardar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hook */}
        <div className="space-y-2">
          <Label htmlFor="hook">
            Hook <span className="text-muted-foreground text-xs">(primeros 3 segundos)</span>
          </Label>
          <Textarea
            id="hook"
            placeholder="Que va a captar la atencion inmediatamente?"
            value={formData.hook}
            onChange={(e) => handleChange('hook', e.target.value)}
            rows={2}
          />
        </div>

        {/* Script */}
        <div className="space-y-2">
          <Label htmlFor="script">
            Guion / Copy
          </Label>
          <Textarea
            id="script"
            placeholder="Escribe el guion completo del anuncio..."
            value={formData.script}
            onChange={(e) => handleChange('script', e.target.value)}
            rows={6}
          />
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <Label htmlFor="cta">
            Call to Action (CTA)
          </Label>
          <Textarea
            id="cta"
            placeholder="Que accion quieres que tome el usuario?"
            value={formData.cta}
            onChange={(e) => handleChange('cta', e.target.value)}
            rows={2}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            Notas adicionales
          </Label>
          <Textarea
            id="notes"
            placeholder="Referencias visuales, musica, estilo, etc..."
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
