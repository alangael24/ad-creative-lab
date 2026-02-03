import { KanbanBoard } from '@/components/board/KanbanBoard'
import { prisma } from '@/lib/db'

async function getAds() {
  // Auto-move expired testing ads to analysis
  const now = new Date()
  await prisma.ad.updateMany({
    where: {
      status: 'testing',
      reviewDate: { lte: now },
    },
    data: {
      status: 'analysis',
      isLocked: false,
    },
  })

  // Get all non-completed ads
  const ads = await prisma.ad.findMany({
    where: {
      status: { not: 'completed' },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      learnings: true,
    },
  })

  return ads.map(ad => ({
    id: ad.id,
    name: ad.name,
    concept: ad.concept,
    angleType: ad.angleType,
    format: ad.format,
    status: ad.status,
    isLocked: ad.isLocked,
    reviewDate: ad.reviewDate?.toISOString() || null,
    thumbnailUrl: ad.thumbnailUrl,
    result: ad.result,
    hypothesis: ad.hypothesis,
    dueDate: ad.dueDate?.toISOString() || null,
  }))
}

export default async function BoardPage() {
  const ads = await getAds()

  return (
    <div className="max-w-full mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tablero Kanban</h1>
      </div>
      <KanbanBoard initialAds={ads} />
    </div>
  )
}
