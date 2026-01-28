import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const competitor = await prisma.competitor.findUnique({
      where: { id },
      include: {
        ads: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Error fetching competitor:', error)
    return NextResponse.json({ error: 'Error fetching competitor' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const competitor = await prisma.competitor.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(competitor)
  } catch (error) {
    console.error('Error updating competitor:', error)
    return NextResponse.json({ error: 'Error updating competitor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cascade delete is set in schema, so this will delete ads too
    await prisma.competitor.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competitor:', error)
    return NextResponse.json({ error: 'Error deleting competitor' }, { status: 500 })
  }
}
