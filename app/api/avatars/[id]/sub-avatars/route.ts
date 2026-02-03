import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const subAvatars = await prisma.subAvatar.findMany({
      where: { avatarId: id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subAvatars)
  } catch (error) {
    console.error('Error fetching sub-avatars:', error)
    return NextResponse.json({ error: 'Error fetching sub-avatars' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { name, painPoint, desire, trigger, objection, awareness, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    if (!painPoint?.trim()) {
      return NextResponse.json({ error: 'El pain point es obligatorio' }, { status: 400 })
    }

    if (!desire?.trim()) {
      return NextResponse.json({ error: 'El deseo es obligatorio' }, { status: 400 })
    }

    // Verify avatar exists
    const avatar = await prisma.avatar.findUnique({ where: { id } })
    if (!avatar) {
      return NextResponse.json({ error: 'Avatar no encontrado' }, { status: 404 })
    }

    const subAvatar = await prisma.subAvatar.create({
      data: {
        name,
        painPoint,
        desire,
        trigger: trigger || null,
        objection: objection || null,
        awareness: awareness || 'unaware',
        notes: notes || null,
        avatarId: id,
      },
    })

    return NextResponse.json(subAvatar, { status: 201 })
  } catch (error) {
    console.error('Error creating sub-avatar:', error)
    return NextResponse.json({ error: 'Error creating sub-avatar' }, { status: 500 })
  }
}
