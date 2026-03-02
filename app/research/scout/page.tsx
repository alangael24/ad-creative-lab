import { prisma } from '@/lib/db'
import { ScoutHub } from './ScoutHub'

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

async function getSessions(avatarFilter?: string) {
  const where = avatarFilter ? { avatarId: avatarFilter } : {}

  const sessions = await prisma.scoutSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      avatar: {
        select: { name: true },
      },
    },
  })

  return sessions.map((s) => ({
    id: s.id,
    status: s.status,
    query: s.query,
    totalFindings: s.totalFindings,
    avatarName: s.avatar.name,
    createdAt: s.createdAt.toISOString(),
  }))
}

export default async function ScoutPage() {
  const avatars = await getAvatars()
  const sessions = await getSessions()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <ScoutHub avatars={avatars} initialSessions={sessions} />
    </div>
  )
}
