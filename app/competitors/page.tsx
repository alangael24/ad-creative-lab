import Link from 'next/link'
import { prisma } from '@/lib/db'
import { CompetitorList } from '@/components/competitors/CompetitorList'
import { Button } from '@/components/ui/button'
import { LayoutGrid } from 'lucide-react'

async function getCompetitors() {
  const competitors = await prisma.competitor.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { ads: true },
      },
      ads: {
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          thumbnailUrl: true,
          mediaUrl: true,
          mediaType: true,
        },
      },
    },
  })

  return competitors
}

async function getTotalAds() {
  return await prisma.competitorAd.count()
}

export default async function CompetitorsPage() {
  const competitors = await getCompetitors()
  const totalAds = await getTotalAds()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Libreria de Competidores</h1>
          <p className="text-muted-foreground mt-1">
            Guarda los ads de la competencia para inspiracion y analisis
          </p>
        </div>

        {totalAds > 0 && (
          <Link href="/competitors/wall">
            <Button variant="outline" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Muro de Creativos
              <span className="text-muted-foreground">({totalAds})</span>
            </Button>
          </Link>
        )}
      </div>

      <CompetitorList competitors={competitors} />
    </div>
  )
}
