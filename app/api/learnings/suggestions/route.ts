import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const angle = searchParams.get('angle')
    const format = searchParams.get('format')
    // concept is available for future use in similarity matching
    const _concept = searchParams.get('concept')

    // Build where clause based on provided filters
    const where: Record<string, unknown> = {}
    if (angle) where.angle = angle
    if (format) where.format = format

    // Get learnings that match the criteria
    const learnings = await prisma.learning.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        ad: {
          select: {
            name: true,
            concept: true,
            result: true,
            thumbnailUrl: true,
            spend: true,
            revenue: true,
          },
        },
      },
    })

    // Get element-level insights (hooks, scripts, etc that worked or failed)
    const elementInsights = await prisma.ad.findMany({
      where: {
        status: 'completed',
        OR: [
          { angle: angle || undefined },
          { format: format || undefined },
        ],
      },
      select: {
        id: true,
        concept: true,
        result: true,
        hookResult: true,
        hookNote: true,
        avatarResult: true,
        avatarNote: true,
        scriptResult: true,
        scriptNote: true,
        ctaResult: true,
        ctaNote: true,
        visualResult: true,
        visualNote: true,
        audioResult: true,
        audioNote: true,
        failReasons: true,
        successFactors: true,
      },
      orderBy: { closedAt: 'desc' },
      take: 20,
    })

    // Extract working hooks, failed hooks, etc
    const workingHooks = elementInsights
      .filter(ad => ad.hookResult === 'worked' && ad.hookNote)
      .map(ad => ({ note: ad.hookNote, result: ad.result, concept: ad.concept }))

    const failedHooks = elementInsights
      .filter(ad => ad.hookResult === 'failed' && ad.hookNote)
      .map(ad => ({ note: ad.hookNote, result: ad.result, concept: ad.concept }))

    const workingCTAs = elementInsights
      .filter(ad => ad.ctaResult === 'worked' && ad.ctaNote)
      .map(ad => ({ note: ad.ctaNote, result: ad.result, concept: ad.concept }))

    const workingVisuals = elementInsights
      .filter(ad => ad.visualResult === 'worked' && ad.visualNote)
      .map(ad => ({ note: ad.visualNote, result: ad.result, concept: ad.concept }))

    const failedVisuals = elementInsights
      .filter(ad => ad.visualResult === 'failed' && ad.visualNote)
      .map(ad => ({ note: ad.visualNote, result: ad.result, concept: ad.concept }))

    // Aggregate fail reasons and success factors
    const failReasonCounts: Record<string, number> = {}
    const successFactorCounts: Record<string, number> = {}

    elementInsights.forEach(ad => {
      if (ad.failReasons) {
        try {
          const reasons = JSON.parse(ad.failReasons) as string[]
          reasons.forEach(r => {
            failReasonCounts[r] = (failReasonCounts[r] || 0) + 1
          })
        } catch { /* ignore parse errors */ }
      }
      if (ad.successFactors) {
        try {
          const factors = JSON.parse(ad.successFactors) as string[]
          factors.forEach(f => {
            successFactorCounts[f] = (successFactorCounts[f] || 0) + 1
          })
        } catch { /* ignore parse errors */ }
      }
    })

    // Sort by frequency
    const topFailReasons = Object.entries(failReasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }))

    const topSuccessFactors = Object.entries(successFactorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => ({ factor, count }))

    return NextResponse.json({
      learnings,
      insights: {
        workingHooks: workingHooks.slice(0, 3),
        failedHooks: failedHooks.slice(0, 3),
        workingCTAs: workingCTAs.slice(0, 3),
        workingVisuals: workingVisuals.slice(0, 3),
        failedVisuals: failedVisuals.slice(0, 3),
        topFailReasons,
        topSuccessFactors,
      },
      meta: {
        totalAdsAnalyzed: elementInsights.length,
        filterApplied: { angle, format },
      },
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json({ error: 'Error fetching suggestions' }, { status: 500 })
  }
}
