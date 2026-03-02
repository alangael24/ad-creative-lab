import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Agregar avatar a un insight
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const link = await prisma.insightAvatar.create({
      data: {
        insightId: id,
        avatarId: body.avatarId,
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

    return NextResponse.json(link)
  } catch (error) {
    console.error('Error linking avatar:', error)
    return NextResponse.json({ error: 'Error linking avatar' }, { status: 500 })
  }
}

// Remover avatar de un insight
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const avatarId = searchParams.get('avatarId')

    if (!avatarId) {
      return NextResponse.json({ error: 'avatarId required' }, { status: 400 })
    }

    await prisma.insightAvatar.deleteMany({
      where: {
        insightId: id,
        avatarId: avatarId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unlinking avatar:', error)
    return NextResponse.json({ error: 'Error unlinking avatar' }, { status: 500 })
  }
}
