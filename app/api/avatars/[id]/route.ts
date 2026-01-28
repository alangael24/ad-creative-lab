import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const avatar = await prisma.avatar.findUnique({
      where: { id },
      include: {
        research: {
          orderBy: { createdAt: 'desc' },
        },
        ads: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            concept: true,
            status: true,
            result: true,
            thumbnailUrl: true,
          },
        },
      },
    })

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    return NextResponse.json(avatar)
  } catch (error) {
    console.error('Error fetching avatar:', error)
    return NextResponse.json({ error: 'Error fetching avatar' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const avatar = await prisma.avatar.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(avatar)
  } catch (error) {
    console.error('Error updating avatar:', error)
    return NextResponse.json({ error: 'Error updating avatar' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete associated research items first
    await prisma.researchItem.deleteMany({
      where: { avatarId: id },
    })

    // Then delete the avatar
    await prisma.avatar.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting avatar:', error)
    return NextResponse.json({ error: 'Error deleting avatar' }, { status: 500 })
  }
}
