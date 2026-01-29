import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const { contentId } = await params
    const body = await request.json()

    const content = await prisma.avatarContent.update({
      where: { id: contentId },
      data: {
        title: body.title,
        sourceUrl: body.sourceUrl,
        platform: body.platform,
        creator: body.creator,
        style: body.style,
        duration: body.duration,
        whatWorks: body.whatWorks,
        notes: body.notes,
        tags: body.tags,
      },
    })

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error updating avatar content:', error)
    return NextResponse.json({ error: 'Error updating content' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const { contentId } = await params

    await prisma.avatarContent.delete({
      where: { id: contentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting avatar content:', error)
    return NextResponse.json({ error: 'Error deleting content' }, { status: 500 })
  }
}
