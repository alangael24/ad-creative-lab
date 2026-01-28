"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { ANGLES, FORMATS, FAIL_REASONS, SUCCESS_FACTORS } from '@/lib/constants'
import { formatCurrency, calculateROAS } from '@/lib/utils'
import {
  Trophy, Skull, ThumbsUp, ThumbsDown, Shuffle, Save, Loader2,
  Image as ImageIcon, ArrowRight, Lightbulb
} from 'lucide-react'

interface Ad {
  id: string
  name: string
  concept: string
  angle: string
  format: string
  hypothesis: string
  thumbnailUrl: string | null
  result: string | null
  diagnosis: string | null
  spend: number | null
  revenue: number | null
  hookResult: string | null
  hookNote: string | null
  avatarResult: string | null
  avatarNote: string | null
  scriptResult: string | null
  scriptNote: string | null
  ctaResult: string | null
  ctaNote: string | null
  visualResult: string | null
  visualNote: string | null
  audioResult: string | null
  audioNote: string | null
  failReasons: string | null
  successFactors: string | null
}

interface VersusViewProps {
  ads: Ad[]
}

export function VersusView({ ads }: VersusViewProps) {
  const router = useRouter()
  const [angleFilter, setAngleFilter] = useState('')
  const [formatFilter, setFormatFilter] = useState('')
  const [selectedWinner, setSelectedWinner] = useState<Ad | null>(null)
  const [selectedLoser, setSelectedLoser] = useState<Ad | null>(null)
  const [insight, setInsight] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const winners = useMemo(() =>
    ads.filter(ad => ad.result === 'winner'),
  [ads])

  const losers = useMemo(() =>
    ads.filter(ad => ad.result === 'loser'),
  [ads])

  // Find matching pairs based on angle and format
  const matchingPairs = useMemo(() => {
    const pairs: Array<{ winner: Ad; loser: Ad }> = []

    winners.forEach(winner => {
      const matchingLoser = losers.find(loser =>
        loser.angle === winner.angle &&
        loser.format === winner.format &&
        loser.id !== winner.id
      )
      if (matchingLoser) {
        pairs.push({ winner, loser: matchingLoser })
      }
    })

    return pairs
  }, [winners, losers])

  // Filter pairs
  const filteredPairs = useMemo(() => {
    return matchingPairs.filter(pair => {
      if (angleFilter && pair.winner.angle !== angleFilter) return false
      if (formatFilter && pair.winner.format !== formatFilter) return false
      return true
    })
  }, [matchingPairs, angleFilter, formatFilter])

  const selectRandomPair = () => {
    const pool = filteredPairs.length > 0 ? filteredPairs : matchingPairs
    if (pool.length === 0) return

    const randomPair = pool[Math.floor(Math.random() * pool.length)]
    setSelectedWinner(randomPair.winner)
    setSelectedLoser(randomPair.loser)
    setInsight('')
    setSaved(false)
  }

  const selectPair = (winner: Ad, loser: Ad) => {
    setSelectedWinner(winner)
    setSelectedLoser(loser)
    setInsight('')
    setSaved(false)
  }

  const saveInsight = async () => {
    if (!insight.trim() || !selectedWinner || !selectedLoser) return

    setIsSaving(true)
    try {
      // Save as a learning linked to the winner
      await fetch('/api/learnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `[VS] ${insight}`,
          type: 'insight',
          adId: selectedWinner.id,
          angle: selectedWinner.angle,
          format: selectedWinner.format,
          result: 'winner',
        }),
      })

      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving insight:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderAdCard = (ad: Ad, type: 'winner' | 'loser') => {
    const angleConfig = ANGLES.find(a => a.value === ad.angle)
    const formatConfig = FORMATS.find(f => f.value === ad.format)
    const roas = calculateROAS(ad.revenue, ad.spend)

    // Parse tags
    const failReasons = ad.failReasons ? JSON.parse(ad.failReasons) as string[] : []
    const successFactors = ad.successFactors ? JSON.parse(ad.successFactors) as string[] : []

    // Get element results
    const elements = [
      { label: 'Hook', result: ad.hookResult, note: ad.hookNote },
      { label: 'Avatar', result: ad.avatarResult, note: ad.avatarNote },
      { label: 'Guion', result: ad.scriptResult, note: ad.scriptNote },
      { label: 'CTA', result: ad.ctaResult, note: ad.ctaNote },
      { label: 'Visual', result: ad.visualResult, note: ad.visualNote },
      { label: 'Audio', result: ad.audioResult, note: ad.audioNote },
    ].filter(e => e.result)

    return (
      <Card className={`flex-1 ${type === 'winner' ? 'border-green-500' : 'border-red-500'} border-2`}>
        <CardHeader className={`${type === 'winner' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
          <CardTitle className="flex items-center gap-2 text-lg">
            {type === 'winner' ? (
              <>
                <Trophy className="h-5 w-5 text-green-600" />
                <span className="text-green-700 dark:text-green-400">WINNER</span>
              </>
            ) : (
              <>
                <Skull className="h-5 w-5 text-red-600" />
                <span className="text-red-700 dark:text-red-400">LOSER</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Thumbnail */}
          <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {ad.thumbnailUrl ? (
              <img src={ad.thumbnailUrl} alt={ad.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold">{ad.concept}</h3>
            <p className="text-xs text-muted-foreground font-mono">{ad.name}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={ad.angle as 'fear' | 'desire' | 'curiosity' | 'offer' | 'tutorial' | 'testimonial'}>
                {angleConfig?.label}
              </Badge>
              <Badge variant="secondary">{formatConfig?.label}</Badge>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted p-2 rounded">
              <p className="text-xs text-muted-foreground">Gasto</p>
              <p className="font-medium">{ad.spend ? formatCurrency(ad.spend) : '-'}</p>
            </div>
            <div className="bg-muted p-2 rounded">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="font-medium">{ad.revenue ? formatCurrency(ad.revenue) : '-'}</p>
            </div>
            <div className="bg-muted p-2 rounded">
              <p className="text-xs text-muted-foreground">ROAS</p>
              <p className={`font-medium ${roas && roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {roas ? `${roas.toFixed(2)}x` : '-'}
              </p>
            </div>
          </div>

          {/* Tags */}
          {(successFactors.length > 0 || failReasons.length > 0) && (
            <div className="space-y-2">
              {successFactors.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {successFactors.map(factor => {
                    const config = SUCCESS_FACTORS.find(f => f.value === factor)
                    return (
                      <span key={factor} className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {config?.icon} {config?.label || factor}
                      </span>
                    )
                  })}
                </div>
              )}
              {failReasons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {failReasons.map(reason => {
                    const config = FAIL_REASONS.find(r => r.value === reason)
                    return (
                      <span key={reason} className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {config?.icon} {config?.label || reason}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Element Results */}
          {elements.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">Elementos</p>
              {elements.map((el, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-xs ${
                    el.result === 'worked'
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : 'bg-red-50 dark:bg-red-950/30'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    {el.result === 'worked' ? (
                      <ThumbsUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <ThumbsDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className="font-medium">{el.label}</span>
                  </div>
                  {el.note && <p className="mt-1 text-muted-foreground">{el.note}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Diagnosis */}
          {ad.diagnosis && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Diagnóstico</p>
              <p className="text-sm bg-muted p-2 rounded">{ad.diagnosis}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (matchingPairs.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Skull className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay pares para comparar</h3>
          <p className="text-muted-foreground">
            Necesitas al menos un Winner y un Loser con el mismo ángulo y formato.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select
          options={[{ value: '', label: 'Todos los Ángulos' }, ...ANGLES]}
          value={angleFilter}
          onChange={(e) => setAngleFilter(e.target.value)}
          className="w-40"
        />
        <Select
          options={[{ value: '', label: 'Todos los Formatos' }, ...FORMATS]}
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="w-40"
        />
        <Button onClick={selectRandomPair} variant="outline">
          <Shuffle className="h-4 w-4 mr-2" />
          Par Aleatorio
        </Button>
        <span className="text-sm text-muted-foreground">
          {filteredPairs.length} pares disponibles
        </span>
      </div>

      {/* Pair Selector */}
      {!selectedWinner && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPairs.slice(0, 9).map((pair, i) => (
            <Card
              key={i}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => selectPair(pair.winner, pair.loser)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant={pair.winner.angle as 'fear' | 'desire' | 'curiosity' | 'offer' | 'tutorial' | 'testimonial'}>
                      {ANGLES.find(a => a.value === pair.winner.angle)?.label}
                    </Badge>
                    <Badge variant="secondary" className="ml-2">
                      {FORMATS.find(f => f.value === pair.winner.format)?.label}
                    </Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-green-600">🏆 {pair.winner.concept}</span>
                  <span className="text-muted-foreground">vs</span>
                  <span className="text-red-600">💀 {pair.loser.concept}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Versus View */}
      {selectedWinner && selectedLoser && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => { setSelectedWinner(null); setSelectedLoser(null); }}>
              ← Volver a seleccionar
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderAdCard(selectedWinner, 'winner')}
            {renderAdCard(selectedLoser, 'loser')}
          </div>

          {/* Insight Input */}
          <Card className="border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Lightbulb className="h-5 w-5" />
                <span className="font-semibold">¿Cuál es la diferencia clave?</span>
              </div>
              <Textarea
                placeholder="Escribe tu observación. Ej: 'El winner usa fondo oscuro que contrasta mejor en el feed. El loser tiene texto muy pequeño.'"
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={saveInsight}
                  disabled={!insight.trim() || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saved ? '¡Guardado!' : 'Guardar Aprendizaje'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
