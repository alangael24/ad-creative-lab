import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subAvatarId: string }> }
) {
  try {
    const { subAvatarId } = await params

    const subAvatar = await prisma.subAvatar.findUnique({
      where: { id: subAvatarId },
      include: {
        avatar: {
          select: { id: true, name: true },
        },
        _count: {
          select: { ads: true },
        },
      },
    })

    if (!subAvatar) {
      return NextResponse.json({ error: 'Sub-avatar no encontrado' }, { status: 404 })
    }

    return NextResponse.json(subAvatar)
  } catch (error) {
    console.error('Error fetching sub-avatar:', error)
    return NextResponse.json({ error: 'Error fetching sub-avatar' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subAvatarId: string }> }
) {
  try {
    const { subAvatarId } = await params
    const body = await request.json()

    const subAvatar = await prisma.subAvatar.findUnique({ where: { id: subAvatarId } })
    if (!subAvatar) {
      return NextResponse.json({ error: 'Sub-avatar no encontrado' }, { status: 404 })
    }

    const updated = await prisma.subAvatar.update({
      where: { id: subAvatarId },
      data: {
        name: body.name ?? subAvatar.name,
        painPoint: body.painPoint ?? subAvatar.painPoint,
        desire: body.desire ?? subAvatar.desire,
        trigger: body.trigger !== undefined ? body.trigger : subAvatar.trigger,
        objection: body.objection !== undefined ? body.objection : subAvatar.objection,
        awareness: body.awareness ?? subAvatar.awareness,
        notes: body.notes !== undefined ? body.notes : subAvatar.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating sub-avatar:', error)
    return NextResponse.json({ error: 'Error updating sub-avatar' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subAvatarId: string }> }
) {
  try {
    const { subAvatarId } = await params

    await prisma.subAvatar.delete({ where: { id: subAvatarId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sub-avatar:', error)
    return NextResponse.json({ error: 'Error deleting sub-avatar' }, { status: 500 })
  }
}
