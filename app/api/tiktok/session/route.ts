import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/tiktok/session - Create a new TikTok scan session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { avatarId, query, scanType, sourceUrl } = body

    if (!scanType) {
      return NextResponse.json({ error: 'scanType es requerido' }, { status: 400 })
    }

    if (!sourceUrl) {
      return NextResponse.json({ error: 'sourceUrl es requerido' }, { status: 400 })
    }

    // Verify avatar exists if provided
    if (avatarId) {
      const avatar = await prisma.avatar.findUnique({
        where: { id: avatarId },
        select: { id: true },
      })
      if (!avatar) {
        return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 })
      }
    }

    const session = await prisma.tikTokScanSession.create({
      data: {
        avatarId: avatarId || null,
        query: query || null,
        scanType,
        sourceUrl,
        status: 'pending',
      },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error creating TikTok scan session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear sesión' },
      { status: 500 }
    )
  }
}

// GET /api/tiktok/session - List sessions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const avatarId = searchParams.get('avatarId')
    const scanType = searchParams.get('scanType')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
    if (avatarId) where.avatarId = avatarId
    if (scanType) where.scanType = scanType
    if (status) where.status = status

    const sessions = await prisma.tikTokScanSession.findMany({
      where,
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            videos: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error listing TikTok scan sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al listar sesiones' },
      { status: 500 }
    )
  }
}
