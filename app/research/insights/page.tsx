import { InsightList } from '@/components/research/InsightList'
import { prisma } from '@/lib/db'

async function getInsights() {
  const insights = await prisma.insight.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      avatars: {
        include: {
          avatar: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  return insights.map(insight => ({
    ...insight,
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
    avatars: insight.avatars.map(a => ({
      avatar: a.avatar,
    })),
  }))
}

export default async function InsightsPage() {
  const insights = await getInsights()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <InsightList insights={insights} />
    </div>
  )
}
