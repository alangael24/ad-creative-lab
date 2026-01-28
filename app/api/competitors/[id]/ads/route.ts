import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitorId } = await params
    const body = await request.json()

    const {
      mediaUrl,
      mediaType,
      thumbnailUrl,
      title,
      sourceUrl,
      platform,
      hook,
      angle,
      cta,
      whatWorks,
      notes,
      tags,
    } = body

    if (!mediaUrl?.trim()) {
      return NextResponse.json({ error: 'El media URL es obligatorio' }, { status: 400 })
    }

    // Verify competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
    })

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    const competitorAd = await prisma.competitorAd.create({
      data: {
        competitorId,
        mediaUrl,
        mediaType: mediaType || 'video',
        thumbnailUrl: thumbnailUrl || null,
        title: title || null,
        sourceUrl: sourceUrl || null,
        platform: platform || null,
        hook: hook || null,
        angle: angle || null,
        cta: cta || null,
        whatWorks: whatWorks || null,
        notes: notes || null,
        tags: tags || null,
      },
    })

    return NextResponse.json(competitorAd, { status: 201 })
  } catch (error) {
    console.error('Error creating competitor ad:', error)
    return NextResponse.json({ error: 'Error creating competitor ad' }, { status: 500 })
  }
}
