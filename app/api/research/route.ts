import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const avatarId = searchParams.get('avatarId')
    const category = searchParams.get('category')
    const source = searchParams.get('source')

    const where: Record<string, unknown> = {}
    if (avatarId) where.avatarId = avatarId
    if (category) where.category = category
    if (source) where.source = source

    const items = await prisma.researchItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching research items:', error)
    return NextResponse.json({ error: 'Error fetching research items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const item = await prisma.researchItem.create({
      data: {
        source: body.source,
        url: body.url || null,
        content: body.content,
        category: body.category,
        context: body.context || null,
        tags: body.tags || null,
        avatarId: body.avatarId || null,
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

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error creating research item:', error)
    return NextResponse.json({ error: 'Error creating research item' }, { status: 500 })
  }
}
