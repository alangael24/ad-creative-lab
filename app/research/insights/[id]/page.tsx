import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { InsightDetailClient } from './InsightDetailClient'

async function getInsight(id: string) {
  const insight = await prisma.insight.findUnique({
    where: { id },
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

  if (!insight) return null

  return {
    ...insight,
    createdAt: insight.createdAt.toISOString(),
    updatedAt: insight.updatedAt.toISOString(),
    avatars: insight.avatars.map(a => ({
      avatar: a.avatar,
    })),
  }
}

async function getAvatars() {
  const avatars = await prisma.avatar.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
    },
  })
  return avatars
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [insight, avatars] = await Promise.all([getInsight(id), getAvatars()])

  if (!insight) {
    notFound()
  }

  return <InsightDetailClient insight={insight} allAvatars={avatars} />
}
