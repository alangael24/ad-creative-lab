import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/tiktok/session/[id]/videos - Bulk save extracted video metadata
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { videos } = body

    if (!Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ error: 'videos array es requerido' }, { status: 400 })
    }

    // Verify session exists
    const session = await prisma.tikTokScanSession.findUnique({
      where: { id },
      select: { id: true, avatarId: true, totalItems: true },
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Create all videos linked to session
    const created = await prisma.tikTokVideo.createMany({
      data: videos.map((v: {
        videoUrl: string
        description?: string
        hashtags?: string[]
        creator?: string
        views?: number
        likes?: number
        shares?: number
        commentsCount?: number
        thumbnailUrl?: string
        musicTitle?: string
      }) => ({
        sessionId: id,
        videoUrl: v.videoUrl,
        description: v.description || null,
        hashtags: v.hashtags ? JSON.stringify(v.hashtags) : null,
        creator: v.creator || null,
        views: v.views || null,
        likes: v.likes || null,
        shares: v.shares || null,
        commentsCount: v.commentsCount || null,
        thumbnailUrl: v.thumbnailUrl || null,
        musicTitle: v.musicTitle || null,
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
    console.error('Error saving TikTok videos:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar videos' },
      { status: 500 }
    )
  }
}
