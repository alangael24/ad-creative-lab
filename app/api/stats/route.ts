import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get all completed ads
    const completedAds = await prisma.ad.findMany({
      where: { status: 'completed' },
      orderBy: { closedAt: 'desc' },
    })

    // Calculate hit rate
    const totalAnalyzed = completedAds.length
    const winners = completedAds.filter(ad => ad.result === 'winner').length
    const hitRate = totalAnalyzed > 0 ? (winners / totalAnalyzed) * 100 : 0

    // Get ads in testing (for money in limbo)
    const testingAds = await prisma.ad.findMany({
      where: { status: 'testing' },
    })
    const moneyInLimbo = testingAds.reduce((sum, ad) => sum + (ad.testingBudget || 0), 0)

    // Get ads ready for analysis (lock expired)
    const now = new Date()
    const adsReadyForAnalysis = await prisma.ad.findMany({
      where: {
        status: 'testing',
        reviewDate: { lte: now },
      },
      select: {
        id: true,
        name: true,
        reviewDate: true,
      },
    })

    // Auto-move expired testing ads to analysis
    if (adsReadyForAnalysis.length > 0) {
      await prisma.ad.updateMany({
        where: {
          id: { in: adsReadyForAnalysis.map(ad => ad.id) },
        },
        data: {
          status: 'analysis',
          isLocked: false,
        },
      })
    }

    // Get ads currently in analysis status
    const analysisAds = await prisma.ad.findMany({
      where: { status: 'analysis' },
      select: {
        id: true,
        name: true,
        reviewDate: true,
      },
    })

    // Calculate trend data (hit rate by week for last 8 weeks)
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const recentAds = completedAds.filter(ad =>
      ad.closedAt && new Date(ad.closedAt) >= eightWeeksAgo
    )

    // Group by week
    const weeklyData: Record<string, { winners: number; total: number }> = {}
    recentAds.forEach(ad => {
      if (!ad.closedAt) return
      const date = new Date(ad.closedAt)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { winners: 0, total: 0 }
      }
      weeklyData[weekKey].total++
      if (ad.result === 'winner') {
        weeklyData[weekKey].winners++
      }
    })

    const trendData = Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period: period.slice(5), // MM-DD format
        hitRate: data.total > 0 ? (data.winners / data.total) * 100 : 0,
      }))

    // Count ads by status
    const statusCounts = await prisma.ad.groupBy({
      by: ['status'],
      _count: true,
    })

    const adsByStatus = Object.fromEntries(
      statusCounts.map(s => [s.status, s._count])
    )

    return NextResponse.json({
      hitRate,
      totalAnalyzed,
      winners,
      losers: totalAnalyzed - winners,
      moneyInLimbo,
      testingCount: testingAds.length,
      adsReadyForAnalysis: analysisAds,
      trendData,
      adsByStatus,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}
