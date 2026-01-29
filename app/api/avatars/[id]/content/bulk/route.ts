import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: avatarId } = await params
    const body = await request.json()

    const { items } = body as {
      items: Array<{
        mediaUrl: string
        mediaType: string
        thumbnailUrl?: string
        platform?: string
        sourceUrl?: string
      }>
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    // Verify avatar exists
    const avatar = await prisma.avatar.findUnique({
      where: { id: avatarId },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // Create all content items
    const createdItems = await prisma.$transaction(
      items.map((item) =>
        prisma.avatarContent.create({
          data: {
            avatarId,
            mediaUrl: item.mediaUrl,
            mediaType: item.mediaType || 'video',
            thumbnailUrl: item.thumbnailUrl || null,
            platform: item.platform || null,
            sourceUrl: item.sourceUrl || null,
            // Other fields null - to be edited later
            title: null,
            creator: null,
            style: null,
            duration: null,
            whatWorks: null,
            notes: null,
            tags: null,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      count: createdItems.length,
      items: createdItems,
    }, { status: 201 })
  } catch (error) {
    console.error('Error bulk creating avatar content:', error)
    return NextResponse.json({ error: 'Error creating content' }, { status: 500 })
  }
}
