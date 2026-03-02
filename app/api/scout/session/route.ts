import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/scout/session - Start a new scout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { avatarId, query, context } = body

    if (!avatarId) {
      return NextResponse.json({ error: 'avatarId es requerido' }, { status: 400 })
    }

    // Verify avatar exists and fetch data
    const avatar = await prisma.avatar.findUnique({
      where: { id: avatarId },
      select: {
        id: true,
        name: true,
        painPoints: true,
        desires: true,
        objections: true,
        language: true,
        organicStyle: true,
        ageRange: true,
        gender: true,
        location: true,
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 })
    }

    // Build a default query from avatar data if none provided
    const searchQuery = query || avatar.name

    const session = await prisma.scoutSession.create({
      data: {
        avatarId,
        query: searchQuery,
        context: context || null,
        status: 'running',
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
    console.error('Error creating scout session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear sesión' },
      { status: 500 }
    )
  }
}
