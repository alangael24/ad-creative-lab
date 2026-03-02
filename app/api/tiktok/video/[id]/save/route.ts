import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/tiktok/video/[id]/save - Save a TikTok video to AvatarContent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Find the video with session info
    const video = await prisma.tikTokVideo.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            avatarId: true,
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
    }

    if (video.savedToResearch) {
      return NextResponse.json({ error: 'Este video ya fue guardado' }, { status: 400 })
    }

    // Need an avatarId to save to AvatarContent
    const avatarId = video.avatarId || video.session.avatarId
    if (!avatarId) {
      return NextResponse.json(
        { error: 'Se necesita un avatarId para guardar el video. Asigna un avatar a la sesión primero.' },
        { status: 400 }
      )
    }

    // Create AvatarContent from the video
    const avatarContent = await prisma.avatarContent.create({
      data: {
        mediaUrl: video.videoUrl,
        mediaType: 'video',
        thumbnailUrl: video.thumbnailUrl || null,
        title: video.description ? video.description.slice(0, 200) : null,
        sourceUrl: video.videoUrl,
        platform: 'tiktok',
        creator: video.creator || null,
        notes: [
          video.musicTitle ? `Music: ${video.musicTitle}` : null,
          video.views != null ? `Views: ${video.views}` : null,
          video.likes != null ? `Likes: ${video.likes}` : null,
          video.shares != null ? `Shares: ${video.shares}` : null,
        ]
          .filter(Boolean)
          .join(' | ') || null,
        tags: video.hashtags || null,
        avatarId,
      },
    })

    // Mark video as saved
    await prisma.tikTokVideo.update({
      where: { id },
      data: { savedToResearch: true },
    })

    return NextResponse.json({ avatarContent, savedToResearch: true })
  } catch (error) {
    console.error('Error saving TikTok video to research:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al guardar video' },
      { status: 500 }
    )
  }
}
