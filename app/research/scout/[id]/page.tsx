import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { ScoutSessionDetail } from './ScoutSessionDetail'

async function getSession(id: string) {
  const session = await prisma.scoutSession.findUnique({
    where: { id },
    include: {
      avatar: {
        select: {
          id: true,
          name: true,
        },
      },
      findings: {
        orderBy: [
          { relevance: 'asc' }, // high first (alphabetical: h < l < m, so we sort custom)
          { createdAt: 'desc' },
        ],
      },
    },
  })

  if (!session) return null

  // Sort findings: high > medium > low
  const relevanceOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
  const sortedFindings = [...session.findings].sort((a, b) => {
    const aOrder = relevanceOrder[a.relevance] ?? 1
    const bOrder = relevanceOrder[b.relevance] ?? 1
    if (aOrder !== bOrder) return aOrder - bOrder
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return {
    id: session.id,
    status: session.status,
    query: session.query,
    context: session.context,
    totalFindings: session.totalFindings,
    avatarId: session.avatar.id,
    avatarName: session.avatar.name,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    findings: sortedFindings.map((f) => ({
      id: f.id,
      type: f.type,
      content: f.content,
      sourceUrl: f.sourceUrl,
      creator: f.creator,
      engagement: f.engagement,
      relevance: f.relevance,
      relevanceReason: f.relevanceReason,
      category: f.category,
      thumbnailUrl: f.thumbnailUrl,
      savedToResearch: f.savedToResearch,
      createdAt: f.createdAt.toISOString(),
    })),
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ScoutSessionPage({ params }: PageProps) {
  const { id } = await params
  const session = await getSession(id)

  if (!session) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <ScoutSessionDetail session={session} />
    </div>
  )
}
