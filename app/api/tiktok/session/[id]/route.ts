import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/tiktok/session/[id] - Get session with comments and videos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await prisma.tikTokScanSession.findUnique({
      where: { id },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            painPoints: true,
            desires: true,
            objections: true,
            language: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
        videos: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            comments: true,
            videos: true,
          },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching TikTok scan session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al obtener sesión' },
      { status: 500 }
    )
  }
}
