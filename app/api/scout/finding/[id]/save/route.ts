import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/scout/finding/[id]/save - Save finding to research
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the scout finding with session info
    const finding = await prisma.scoutFinding.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            avatarId: true,
          },
        },
      },
    })

    if (!finding) {
      return NextResponse.json({ error: 'Hallazgo no encontrado' }, { status: 404 })
    }

    if (finding.savedToResearch) {
      return NextResponse.json({ error: 'Este hallazgo ya fue guardado' }, { status: 400 })
    }

    // Map finding category to research category
    const categoryMap: Record<string, string> = {
      pain_point: 'pain_point',
      desire: 'desire',
      objection: 'objection',
      language: 'language',
      trend: 'insight',
      content_idea: 'insight',
    }

    // Create a research item from the finding
    const researchItem = await prisma.researchItem.create({
      data: {
        source: 'tiktok_comments',
        url: finding.sourceUrl,
        content: finding.content,
        category: categoryMap[finding.category] || 'insight',
        context: `[Scout] ${finding.relevanceReason}${finding.creator ? ` | Creador: ${finding.creator}` : ''}`,
        avatarId: finding.session.avatarId,
      },
    })

    // Mark finding as saved
    await prisma.scoutFinding.update({
      where: { id },
      data: { savedToResearch: true },
    })

    return NextResponse.json({ researchItem, savedToResearch: true })
  } catch (error) {
    console.error('Error saving finding to research:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar hallazgo' },
      { status: 500 }
    )
  }
}
