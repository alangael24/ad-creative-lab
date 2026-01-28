import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const competitors = await prisma.competitor.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { ads: true },
        },
        ads: {
          take: 4,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            thumbnailUrl: true,
            mediaUrl: true,
            mediaType: true,
          },
        },
      },
    })

    return NextResponse.json(competitors)
  } catch (error) {
    console.error('Error fetching competitors:', error)
    return NextResponse.json({ error: 'Error fetching competitors' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { name, description, website, tiktok, instagram, facebook, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const competitor = await prisma.competitor.create({
      data: {
        name: name.trim(),
        description: description || null,
        website: website || null,
        tiktok: tiktok || null,
        instagram: instagram || null,
        facebook: facebook || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(competitor, { status: 201 })
  } catch (error) {
    console.error('Error creating competitor:', error)
    return NextResponse.json({ error: 'Error creating competitor' }, { status: 500 })
  }
}
