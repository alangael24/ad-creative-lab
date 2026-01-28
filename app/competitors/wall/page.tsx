import { prisma } from '@/lib/db'
import { CreativeWall } from '@/components/competitors/CreativeWall'

async function getInitialAds() {
  const ads = await prisma.competitorAd.findMany({
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      competitor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const total = await prisma.competitorAd.count()

  return { ads, total }
}

async function getFilterStats() {
  // Get counts for filters
  const ads = await prisma.competitorAd.findMany({
    select: {
      platform: true,
      angle: true,
      tags: true,
    },
  })

  const platforms: Record<string, number> = {}
  const angles: Record<string, number> = {}
  const tags: Record<string, number> = {}

  ads.forEach(ad => {
    if (ad.platform) {
      platforms[ad.platform] = (platforms[ad.platform] || 0) + 1
    }
    if (ad.angle) {
      angles[ad.angle] = (angles[ad.angle] || 0) + 1
    }
    if (ad.tags) {
      try {
        const adTags = JSON.parse(ad.tags) as string[]
        adTags.forEach(tag => {
          tags[tag] = (tags[tag] || 0) + 1
        })
      } catch {
        // ignore
      }
    }
  })

  return { platforms, angles, tags }
}

export default async function CreativeWallPage() {
  const { ads, total } = await getInitialAds()
  const stats = await getFilterStats()

  return (
    <div className="max-w-[1800px] mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Muro de Creativos</h1>
        <p className="text-muted-foreground mt-1">
          {total} ads de competidores para inspiracion
        </p>
      </div>

      <CreativeWall
        initialAds={ads}
        total={total}
        filterStats={stats}
      />
    </div>
  )
}
