import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { targetStatus } = body

    const ad = await prisma.ad.findUnique({ where: { id } })
    if (!ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // Validation: Can't move locked ads
    if (ad.isLocked && ad.status === 'testing') {
      const reviewDate = ad.reviewDate ? new Date(ad.reviewDate) : null
      if (reviewDate && reviewDate > new Date()) {
        return NextResponse.json(
          { error: 'Este anuncio esta bloqueado en testeo. Espera a que termine el periodo de prueba.' },
          { status: 400 }
        )
      }
    }

    // Validation: Need hypothesis to move to production or testing
    if ((targetStatus === 'production' || targetStatus === 'testing') && !ad.hypothesis) {
      return NextResponse.json(
        { error: 'Necesitas agregar una hipotesis antes de mover a produccion o testeo.' },
        { status: 400 }
      )
    }

    // Prepare update data based on target status
    const updateData: Record<string, unknown> = {
      status: targetStatus,
    }

    // If moving to testing, set lock and review date
    if (targetStatus === 'testing') {
      const now = new Date()
      const reviewDate = new Date(now)
      reviewDate.setDate(reviewDate.getDate() + (ad.lockDays || 10))

      updateData.testingStartedAt = now
      updateData.reviewDate = reviewDate
      updateData.isLocked = true
    }

    // If moving out of testing, unlock
    if (ad.status === 'testing' && targetStatus !== 'testing') {
      updateData.isLocked = false
    }

    // If moving to completed, set closedAt
    if (targetStatus === 'completed') {
      updateData.closedAt = new Date()
    }

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: updateData,
      include: {
        learnings: true,
      },
    })

    return NextResponse.json(updatedAd)
  } catch (error) {
    console.error('Error moving ad:', error)
    return NextResponse.json({ error: 'Error moving ad' }, { status: 500 })
  }
}
