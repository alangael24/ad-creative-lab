import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: avatarId } = await params

    const content = await prisma.avatarContent.findMany({
      where: { avatarId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching avatar content:', error)
    return NextResponse.json({ error: 'Error fetching content' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: avatarId } = await params
    const body = await request.json()

    // Verify avatar exists
    const avatar = await prisma.avatar.findUnique({
      where: { id: avatarId },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    const content = await prisma.avatarContent.create({
      data: {
        avatarId,
        mediaUrl: body.mediaUrl,
        mediaType: body.mediaType || 'video',
        thumbnailUrl: body.thumbnailUrl || null,
        title: body.title || null,
        sourceUrl: body.sourceUrl || null,
        platform: body.platform || null,
        creator: body.creator || null,
        style: body.style || null,
        duration: body.duration || null,
        whatWorks: body.whatWorks || null,
        notes: body.notes || null,
        tags: body.tags || null,
      },
    })

    return NextResponse.json(content, { status: 201 })
  } catch (error) {
    console.error('Error creating avatar content:', error)
    return NextResponse.json({ error: 'Error creating content' }, { status: 500 })
  }
}
