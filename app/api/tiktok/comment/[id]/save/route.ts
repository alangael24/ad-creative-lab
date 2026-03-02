import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/tiktok/comment/[id]/save - Save a TikTok comment to ResearchItem
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the comment with session info
    const comment = await prisma.tikTokComment.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            avatarId: true,
            sourceUrl: true,
          },
        },
      },
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 })
    }

    if (comment.savedToResearch) {
      return NextResponse.json({ error: 'Este comentario ya fue guardado' }, { status: 400 })
    }

    // Map comment category to ResearchItem category
    const categoryMap: Record<string, string> = {
      pain_point: 'pain_point',
      desire: 'desire',
      objection: 'objection',
      language: 'language',
      neutral: 'insight',
    }

    // Create a research item from the comment
    const researchItem = await prisma.researchItem.create({
      data: {
        source: 'TikTok Comments',
        url: comment.videoUrl || comment.session.sourceUrl,
        content: comment.commentText,
        category: categoryMap[comment.category || 'neutral'] || 'insight',
        context: `@${comment.username}${comment.replyTo ? ` (reply to @${comment.replyTo})` : ''} | Likes: ${comment.likes}${comment.sentiment ? ` | Sentiment: ${comment.sentiment}` : ''}`,
        avatarId: comment.avatarId || comment.session.avatarId || null,
      },
    })

    // Mark comment as saved
    await prisma.tikTokComment.update({
      where: { id },
      data: { savedToResearch: true },
    })

    return NextResponse.json({ researchItem, savedToResearch: true })
  } catch (error) {
    console.error('Error saving TikTok comment to research:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar comentario' },
      { status: 500 }
    )
  }
}
