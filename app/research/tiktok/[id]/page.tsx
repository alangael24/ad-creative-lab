import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { TikTokSessionDetail } from './TikTokSessionDetail'

async function getSession(id: string) {
  const session = await prisma.tikTokScanSession.findUnique({
    where: { id },
    include: {
      avatar: {
        select: {
          id: true,
          name: true,
          painPoints: true,
          desires: true,
        },
      },
      comments: {
        orderBy: [
          { relevanceScore: 'desc' },
          { likes: 'desc' },
        ],
      },
      videos: {
        orderBy: [
          { relevanceScore: 'desc' },
          { views: 'desc' },
        ],
      },
    },
  })

  if (!session) return null

  return {
    ...session,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    comments: session.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    videos: session.videos.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    })),
  }
}

export default async function TikTokSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession(id)

  if (!session) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <TikTokSessionDetail session={session} />
    </div>
  )
}
