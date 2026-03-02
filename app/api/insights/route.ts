import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const insights = await prisma.insight.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        avatars: {
          include: {
            avatar: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json({ error: 'Error fetching insights' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const insight = await prisma.insight.create({
      data: {
        title: body.title || 'Sin título',
        content: body.content || '',
      },
    })

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Error creating insight:', error)
    return NextResponse.json({ error: 'Error creating insight' }, { status: 500 })
  }
}
