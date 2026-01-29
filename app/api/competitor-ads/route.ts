import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag')
    const platform = searchParams.get('platform')
    const angle = searchParams.get('angle')
    const limitParam = parseInt(searchParams.get('limit') || '50')
    const offsetParam = parseInt(searchParams.get('offset') || '0')

    // Protect against NaN
    const limit = isNaN(limitParam) ? 50 : limitParam
    const offset = isNaN(offsetParam) ? 0 : offsetParam

    // Build where clause
    const where: Record<string, unknown> = {}

    if (platform) {
      where.platform = platform
    }

    if (angle) {
      where.angle = angle
    }

    // If filtering by tag, we need to fetch more and filter in memory
    // since tags is a JSON string, not a proper relation
    const fetchMultiplier = tag ? 5 : 1 // Fetch 5x more when filtering by tag

    const ads = await prisma.competitorAd.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: (limit * fetchMultiplier) + 1,
      skip: tag ? 0 : offset, // Don't use DB offset when filtering by tag
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
      // Apply manual offset/pagination for tag filtering
      filteredAds = filteredAds.slice(offset)
    }

    // Check if there are more results
    const hasMore = filteredAds.length > limit
    const results = hasMore ? filteredAds.slice(0, limit) : filteredAds

    // Get total count - for tag filtering, we need to count manually
    let total: number
    if (tag) {
      // Count all ads matching tag (less efficient but accurate)
      const allAdsForCount = await prisma.competitorAd.findMany({
        where,
        select: { tags: true },
      })
      total = allAdsForCount.filter(ad => {
        if (!ad.tags) return false
        try {
          const tags = JSON.parse(ad.tags) as string[]
          return tags.includes(tag)
        } catch {
          return false
        }
      }).length
    } else {
      total = await prisma.competitorAd.count({ where })
    }

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
