import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/tiktok/session/[id]/comments - Bulk save extracted comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { comments } = body

    if (!Array.isArray(comments) || comments.length === 0) {
      return NextResponse.json({ error: 'comments array es requerido' }, { status: 400 })
    }

    // Verify session exists
    const session = await prisma.tikTokScanSession.findUnique({
      where: { id },
      select: { id: true, avatarId: true, totalItems: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Create all comments linked to session
    const created = await prisma.tikTokComment.createMany({
      data: comments.map((c: {
        username: string
        commentText: string
        likes?: number
        timestamp?: string
        replyTo?: string
        videoUrl?: string
      }) => ({
        sessionId: id,
        username: c.username,
        commentText: c.commentText,
        likes: c.likes || 0,
        timestamp: c.timestamp || null,
        replyTo: c.replyTo || null,
        videoUrl: c.videoUrl || null,
        avatarId: session.avatarId || null,
      })),
    })

    // Update session totalItems count
    await prisma.tikTokScanSession.update({
      where: { id },
      data: {
        totalItems: session.totalItems + created.count,
        status: 'scanning',
      },
    })

    return NextResponse.json({ created: created.count })
  } catch (error) {
    console.error('Error saving TikTok comments:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar comentarios' },
      { status: 500 }
    )
  }
}
