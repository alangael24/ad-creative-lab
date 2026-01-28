import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const angle = searchParams.get('angle')
    const format = searchParams.get('format')
    const result = searchParams.get('result')

    const where: Record<string, string> = {}
    if (angle) where.angle = angle
    if (format) where.format = format
    if (result) where.result = result

    const learnings = await prisma.learning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ad: {
          select: {
            id: true,
            name: true,
            concept: true,
            thumbnailUrl: true,
          },
        },
      },
    })

    return NextResponse.json(learnings)
  } catch (error) {
    console.error('Error fetching learnings:', error)
    return NextResponse.json({ error: 'Error fetching learnings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { content, type, adId, angle, format, result } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: 'El contenido es obligatorio' }, { status: 400 })
    }

    const learning = await prisma.learning.create({
      data: {
        content,
        type: type || 'insight',
        adId: adId || null,
        angle: angle || null,
        format: format || null,
        result: result || null,
      },
    })

    return NextResponse.json(learning, { status: 201 })
  } catch (error) {
    console.error('Error creating learning:', error)
    return NextResponse.json({ error: 'Error creating learning' }, { status: 500 })
  }
}
