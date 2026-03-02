import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/scout/sessions - List all sessions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const avatarId = searchParams.get('avatarId')

    const where: Record<string, unknown> = {}
    if (avatarId) where.avatarId = avatarId

    const sessions = await prisma.scoutSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { findings: true },
        },
      },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching scout sessions:', error)
    return NextResponse.json({ error: 'Error al obtener sesiones' }, { status: 500 })
  }
}
