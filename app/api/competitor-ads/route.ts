import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const platform = searchParams.get('platform')
    const angle = searchParams.get('angle')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (platform) {
      where.platform = platform
    }

    if (angle) {
      where.angle = angle
    }

    // For tags, we need to filter after fetching since it's a JSON string
    const ads = await prisma.competitorAd.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Get one extra to check if there are more
      skip: offset,
      include: {
        competitor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Filter by tag if specified (JSON array search)
    let filteredAds = ads
    if (tag) {
      filteredAds = ads.filter(ad => {
        if (!ad.tags) return false
        try {
          const tags = JSON.parse(ad.tags) as string[]
          return tags.includes(tag)
        } catch {
          return false
        }
      })
    }

    // Check if there are more results
    const hasMore = filteredAds.length > limit
    const results = hasMore ? filteredAds.slice(0, limit) : filteredAds

    // Get total count for UI
    const total = await prisma.competitorAd.count({ where })

    return NextResponse.json({
      ads: results,
      hasMore,
      total,
      offset,
      limit,
    })
  } catch (error) {
    console.error('Error fetching competitor ads:', error)
    return NextResponse.json({ error: 'Error fetching competitor ads' }, { status: 500 })
  }
}
