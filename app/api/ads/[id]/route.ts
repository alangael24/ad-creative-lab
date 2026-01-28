import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        learnings: true,
      },
    })

    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    return NextResponse.json(ad)
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json({ error: 'Error fetching ad' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const ad = await prisma.ad.findUnique({ where: { id } })
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // Extract saveLearning flag before updating
    const { saveLearning, ...updateData } = body

    // Update the ad
    const updatedAd = await prisma.ad.update({
      where: { id },
      data: updateData,
      include: {
        learnings: true,
      },
    })

    // If completing analysis and saveLearning is true, create a learning
    if (saveLearning && updateData.diagnosis && updateData.status === 'completed') {
      await prisma.learning.create({
        data: {
          content: updateData.diagnosis,
          type: 'insight',
          adId: id,
          angle: ad.angle,
          format: ad.format,
          result: updateData.result,
          // Copy element evaluations with notes
          hookResult: updateData.hookResult || null,
          hookNote: updateData.hookNote || null,
          avatarResult: updateData.avatarResult || null,
          avatarNote: updateData.avatarNote || null,
          scriptResult: updateData.scriptResult || null,
          scriptNote: updateData.scriptNote || null,
          ctaResult: updateData.ctaResult || null,
          ctaNote: updateData.ctaNote || null,
          visualResult: updateData.visualResult || null,
          visualNote: updateData.visualNote || null,
          audioResult: updateData.audioResult || null,
          audioNote: updateData.audioNote || null,
        },
      })
    }

    return NextResponse.json(updatedAd)
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json({ error: 'Error updating ad' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.ad.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ad:', error)
    return NextResponse.json({ error: 'Error deleting ad' }, { status: 500 })
  }
}
