import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const competitorAd = await prisma.competitorAd.findUnique({
      where: { id },
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!competitorAd) {
      return NextResponse.json({ error: 'Competitor ad not found' }, { status: 404 })
    }

    return NextResponse.json(competitorAd)
  } catch (error) {
    console.error('Error fetching competitor ad:', error)
    return NextResponse.json({ error: 'Error fetching competitor ad' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const competitorAd = await prisma.competitorAd.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(competitorAd)
  } catch (error) {
    console.error('Error updating competitor ad:', error)
    return NextResponse.json({ error: 'Error updating competitor ad' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.competitorAd.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting competitor ad:', error)
    return NextResponse.json({ error: 'Error deleting competitor ad' }, { status: 500 })
  }
}
