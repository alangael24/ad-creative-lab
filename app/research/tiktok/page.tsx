import { prisma } from '@/lib/db'
import { TikTokScanHub } from '@/components/research/tiktok/TikTokScanHub'

async function getAvatars() {
  const avatars = await prisma.avatar.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      painPoints: true,
      desires: true,
    },
  })
  return avatars
}

async function getSessions() {
  const sessions = await prisma.tikTokScanSession.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      avatar: {
        select: { name: true },
      },
      _count: {
        select: {
          comments: true,
          videos: true,
        },
      },
    },
  })

  return sessions.map((s) => ({
    id: s.id,
    status: s.status,
    scanType: s.scanType,
    sourceUrl: s.sourceUrl,
    query: s.query,
    totalItems: s.totalItems || (s._count.comments + s._count.videos),
    avatarName: s.avatar?.name || null,
    createdAt: s.createdAt.toISOString(),
  }))
}

export default async function TikTokPage() {
  const avatars = await getAvatars()
  const sessions = await getSessions()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <TikTokScanHub avatars={avatars} initialSessions={sessions} />
    </div>
  )
}
