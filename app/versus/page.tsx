import { VersusView } from '@/components/library/VersusView'
import { prisma } from '@/lib/db'

async function getCompletedAds() {
  const ads = await prisma.ad.findMany({
    where: { status: 'completed' },
    orderBy: { closedAt: 'desc' },
  })

  return ads.map(ad => ({
    id: ad.id,
    name: ad.name,
    concept: ad.concept,
    angle: ad.angle,
    format: ad.format,
    hypothesis: ad.hypothesis,
    thumbnailUrl: ad.thumbnailUrl,
    result: ad.result,
    diagnosis: ad.diagnosis,
    spend: ad.spend,
    revenue: ad.revenue,
    // Element results
    hookResult: ad.hookResult,
    hookNote: ad.hookNote,
    avatarResult: ad.avatarResult,
    avatarNote: ad.avatarNote,
    scriptResult: ad.scriptResult,
    scriptNote: ad.scriptNote,
    ctaResult: ad.ctaResult,
    ctaNote: ad.ctaNote,
    visualResult: ad.visualResult,
    visualNote: ad.visualNote,
    audioResult: ad.audioResult,
    audioNote: ad.audioNote,
    // Tags
    failReasons: ad.failReasons,
    successFactors: ad.successFactors,
  }))
}

export default async function VersusPage() {
  const ads = await getCompletedAds()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Battleground</h1>
        <p className="text-muted-foreground mt-1">
          Compara Winners vs Losers lado a lado para identificar diferencias clave
        </p>
      </div>
      <VersusView ads={ads} />
    </div>
  )
}
