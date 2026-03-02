import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const insight = await prisma.insight.findUnique({
      where: { id },
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

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
    }

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Error fetching insight:', error)
    return NextResponse.json({ error: 'Error fetching insight' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const insight = await prisma.insight.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
      },
    })

    return NextResponse.json(insight)
  } catch (error) {
    console.error('Error updating insight:', error)
    return NextResponse.json({ error: 'Error updating insight' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.insight.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting insight:', error)
    return NextResponse.json({ error: 'Error deleting insight' }, { status: 500 })
  }
}
