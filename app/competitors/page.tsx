import { prisma } from '@/lib/db'
import { CompetitorList } from '@/components/competitors/CompetitorList'

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

export default async function CompetitorsPage() {
  const competitors = await getCompetitors()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Libreria de Competidores</h1>
        <p className="text-muted-foreground mt-1">
          Guarda los ads de la competencia para inspiracion y analisis
        </p>
      </div>

      <CompetitorList competitors={competitors} />
    </div>
  )
}
