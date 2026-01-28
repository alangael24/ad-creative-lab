import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PostMortemForm } from '@/components/ads/PostMortemForm'
import { DevelopmentForm } from '@/components/ads/DevelopmentForm'
import { DeleteAdButton } from '@/components/ads/DeleteAdButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/db'
import { ANGLES, FORMATS, STATUSES } from '@/lib/constants'
import { formatCurrency, calculateROAS, getDaysRemaining } from '@/lib/utils'
import { ArrowLeft, Lock, Clock } from 'lucide-react'

async function getAd(id: string) {
  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      learnings: true,
    },
  })
  return ad
}

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ad = await getAd(id)

  if (!ad) {
    notFound()
  }

  const angleConfig = ANGLES.find(a => a.value === ad.angle)
  const formatConfig = FORMATS.find(f => f.value === ad.format)
  const statusConfig = STATUSES.find(s => s.value === ad.status)
  const roas = calculateROAS(ad.revenue, ad.spend)
  const daysRemaining = getDaysRemaining(ad.reviewDate)

  // If in analysis status, show post-mortem form
  if (ad.status === 'analysis') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/board" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al tablero
          </Link>
          <DeleteAdButton adId={ad.id} adName={ad.concept} />
        </div>
        <PostMortemForm
          ad={{
            id: ad.id,
            name: ad.name,
            concept: ad.concept,
            angle: ad.angle,
            format: ad.format,
            hypothesis: ad.hypothesis,
            thumbnailUrl: ad.thumbnailUrl,
            spend: ad.spend,
            impressions: ad.impressions,
            clicks: ad.clicks,
            purchases: ad.purchases,
            revenue: ad.revenue,
            videoViewThreeSeconds: ad.videoViewThreeSeconds,
            videoViewThruplay: ad.videoViewThruplay,
          }}
        />
      </div>
    )
  }

  // Otherwise show detail view
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/board" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver al tablero
        </Link>
        <DeleteAdButton adId={ad.id} adName={ad.concept} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{ad.concept}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">{ad.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {ad.isLocked && ad.status === 'testing' && (
                  <Badge variant="testing" className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Bloqueado
                  </Badge>
                )}
                {ad.result && (
                  <Badge variant={ad.result as 'winner' | 'loser'}>
                    {ad.result === 'winner' ? 'Winner' : 'Loser'}
                  </Badge>
                )}
                <Badge variant={ad.status as 'idea' | 'production' | 'testing' | 'analysis'}>
                  {statusConfig?.label || ad.status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Thumbnail */}
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              {ad.thumbnailUrl ? (
                <img src={ad.thumbnailUrl} alt={ad.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-muted-foreground">Sin imagen</span>
              )}
            </div>

            {/* Testing Lock Info */}
            {ad.status === 'testing' && ad.isLocked && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">
                    {daysRemaining > 0
                      ? `${daysRemaining} dias restantes de testeo`
                      : 'Periodo de testeo completado - Listo para analisis'}
                  </span>
                </div>
                {ad.reviewDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Fecha de revision: {new Date(ad.reviewDate).toLocaleDateString('es-ES')}
                  </p>
                )}
              </div>
            )}

            {/* Due Date */}
            {ad.dueDate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Fecha limite:</span>{' '}
                  <span className="font-medium">{new Date(ad.dueDate).toLocaleDateString('es-ES')}</span>
                </p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Angulo</p>
                <Badge variant={ad.angle as 'fear' | 'desire' | 'curiosity' | 'offer' | 'tutorial' | 'testimonial'}>
                  {angleConfig?.label || ad.angle}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Formato</p>
                <Badge variant="secondary">{formatConfig?.label || ad.format}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funnel</p>
                <p className="font-medium">{ad.funnelStage === 'cold' ? 'Trafico Frio' : 'Retargeting'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fuente</p>
                <p className="font-medium capitalize">{ad.sourceType}</p>
              </div>
              {ad.product && (
                <div>
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="font-medium">{ad.product}</p>
                </div>
              )}
              {ad.testingBudget && (
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto de Testeo</p>
                  <p className="font-medium">{formatCurrency(ad.testingBudget)}</p>
                </div>
              )}
            </div>

            {/* Hypothesis */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Hipotesis</p>
              <p className="bg-muted p-3 rounded-lg italic">&quot;{ad.hypothesis}&quot;</p>
            </div>

            {/* Reference Media (for competitor/iteration ads) */}
            {ad.referenceMediaUrl && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Video/Imagen de Referencia</p>
                <div className="rounded-lg overflow-hidden border bg-muted/30">
                  {ad.referenceMediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={ad.referenceMediaUrl}
                      controls
                      className="w-full max-h-96 object-contain"
                    />
                  ) : (
                    <img
                      src={ad.referenceMediaUrl}
                      alt="Referencia"
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Development Content (show if exists, even if not in development status) */}
            {(ad.hook || ad.script || ad.cta || ad.notes) && ad.status !== 'development' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Desarrollo Creativo</p>
                {ad.hook && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Hook</p>
                    <p className="bg-muted p-3 rounded-lg text-sm">{ad.hook}</p>
                  </div>
                )}
                {ad.script && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Guion</p>
                    <p className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap">{ad.script}</p>
                  </div>
                )}
                {ad.cta && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">CTA</p>
                    <p className="bg-muted p-3 rounded-lg text-sm">{ad.cta}</p>
                  </div>
                )}
                {ad.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notas</p>
                    <p className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap">{ad.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Metrics (if available) */}
            {(ad.spend || ad.revenue) && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Metricas</p>
                <div className="grid grid-cols-3 gap-4">
                  {ad.spend && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Gasto</p>
                      <p className="font-medium">{formatCurrency(ad.spend)}</p>
                    </div>
                  )}
                  {ad.revenue && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-medium">{formatCurrency(ad.revenue)}</p>
                    </div>
                  )}
                  {roas && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">ROAS</p>
                      <p className={`font-medium ${roas >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                        {roas.toFixed(2)}x
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Diagnosis (if completed) */}
            {ad.diagnosis && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Diagnostico</p>
                <p className="bg-muted p-3 rounded-lg">{ad.diagnosis}</p>
              </div>
            )}

            {/* Learnings */}
            {ad.learnings.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Aprendizajes</p>
                <ul className="space-y-2">
                  {ad.learnings.map((learning) => (
                    <li key={learning.id} className="bg-muted p-3 rounded-lg text-sm">
                      {learning.content}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source URL */}
            {ad.sourceUrl && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">URL de Referencia</p>
                <a
                  href={ad.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  {ad.sourceUrl}
                </a>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
              <p>Creado: {new Date(ad.createdAt).toLocaleDateString('es-ES')}</p>
              {ad.closedAt && <p>Completado: {new Date(ad.closedAt).toLocaleDateString('es-ES')}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Development Form - show when in development status */}
        {ad.status === 'development' && (
          <DevelopmentForm
            ad={{
              id: ad.id,
              name: ad.name,
              concept: ad.concept,
              hook: ad.hook,
              script: ad.script,
              cta: ad.cta,
              notes: ad.notes,
            }}
          />
        )}
      </div>
    </div>
  )
}
