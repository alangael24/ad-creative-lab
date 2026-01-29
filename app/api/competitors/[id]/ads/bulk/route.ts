import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitorId } = await params
    const body = await request.json()

    const { ads } = body as {
      ads: Array<{
        mediaUrl: string
        mediaType: string
        thumbnailUrl?: string
      }>
    }

    if (!ads || !Array.isArray(ads) || ads.length === 0) {
      return NextResponse.json({ error: 'No ads provided' }, { status: 400 })
    }

    // Verify competitor exists
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
    })

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 })
    }

    // Create all ads
    const createdAds = await prisma.$transaction(
      ads.map((ad) =>
        prisma.competitorAd.create({
          data: {
            competitorId,
            mediaUrl: ad.mediaUrl,
            mediaType: ad.mediaType || 'video',
            thumbnailUrl: ad.thumbnailUrl || null,
            // All other fields null - to be edited later
            title: null,
            sourceUrl: null,
            platform: null,
            hook: null,
            angle: null,
            cta: null,
            whatWorks: null,
            notes: null,
            tags: null,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      count: createdAds.length,
      ads: createdAds,
    }, { status: 201 })
  } catch (error) {
    console.error('Error bulk creating competitor ads:', error)
    return NextResponse.json({ error: 'Error creating ads' }, { status: 500 })
  }
}
