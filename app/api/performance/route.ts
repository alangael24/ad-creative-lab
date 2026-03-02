import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: { gte?: Date; lte?: Date } = {}
  if (from) dateFilter.gte = new Date(from + 'T00:00:00.000Z')
  if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z')

  const where = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}

  // Aggregate totals
  const totals = await prisma.dailyMetric.aggregate({
    where,
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      revenue: true,
    },
  })

  const totalSpend = totals._sum.spend || 0
  const totalRevenue = totals._sum.revenue || 0
  const totalImpressions = totals._sum.impressions || 0
  const totalClicks = totals._sum.clicks || 0
  const totalPurchases = totals._sum.purchases || 0

  // Daily series for chart
  const dailyRaw = await prisma.dailyMetric.groupBy({
    by: ['date'],
    where,
    _sum: {
      spend: true,
      revenue: true,
    },
    orderBy: { date: 'asc' },
  })

  const daily = dailyRaw.map((d) => ({
    date: d.date.toISOString().split('T')[0],
    spend: d._sum.spend || 0,
    revenue: d._sum.revenue || 0,
  }))

  // Per-ad breakdown
  const metricsPerAd = await prisma.dailyMetric.groupBy({
    by: ['adId'],
    where,
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      revenue: true,
    },
  })

  const adIds = metricsPerAd.map((m) => m.adId)
  const ads = await prisma.ad.findMany({
    where: { id: { in: adIds } },
    select: {
      id: true,
      name: true,
      concept: true,
      format: true,
      angleType: true,
      avatarId: true,
      avatar: { select: { name: true } },
    },
  })

  const adMap = new Map(ads.map((a) => [a.id, a]))

  const perAd = metricsPerAd.map((m) => {
    const ad = adMap.get(m.adId)
    const spend = m._sum.spend || 0
    const revenue = m._sum.revenue || 0
    const impressions = m._sum.impressions || 0
    const clicks = m._sum.clicks || 0
    const purchases = m._sum.purchases || 0

    return {
      adId: m.adId,
      adName: ad?.name || '',
      concept: ad?.concept || '',
      format: ad?.format || '',
      angleType: ad?.angleType || '',
      avatarName: ad?.avatar?.name || 'Sin avatar',
      spend,
      revenue,
      impressions,
      clicks,
      purchases,
      roas: spend > 0 ? revenue / spend : null,
      cpa: purchases > 0 ? spend / purchases : null,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
    }
  })

  // Distribution by format
  const byFormat: Record<string, { spend: number; revenue: number; count: number }> = {}
  for (const a of perAd) {
    if (!byFormat[a.format]) byFormat[a.format] = { spend: 0, revenue: 0, count: 0 }
    byFormat[a.format].spend += a.spend
    byFormat[a.format].revenue += a.revenue
    byFormat[a.format].count++
  }

  // Distribution by angle
  const byAngle: Record<string, { spend: number; revenue: number; count: number }> = {}
  for (const a of perAd) {
    if (!byAngle[a.angleType]) byAngle[a.angleType] = { spend: 0, revenue: 0, count: 0 }
    byAngle[a.angleType].spend += a.spend
    byAngle[a.angleType].revenue += a.revenue
    byAngle[a.angleType].count++
  }

  // Distribution by avatar
  const byAvatar: Record<string, { spend: number; revenue: number; count: number }> = {}
  for (const a of perAd) {
    const key = a.avatarName
    if (!byAvatar[key]) byAvatar[key] = { spend: 0, revenue: 0, count: 0 }
    byAvatar[key].spend += a.spend
    byAvatar[key].revenue += a.revenue
    byAvatar[key].count++
  }

  return NextResponse.json({
    totals: {
      spend: totalSpend,
      revenue: totalRevenue,
      impressions: totalImpressions,
      clicks: totalClicks,
      purchases: totalPurchases,
      roas: totalSpend > 0 ? totalRevenue / totalSpend : null,
      cpa: totalPurchases > 0 ? totalSpend / totalPurchases : null,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : null,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null,
    },
    daily,
    perAd: perAd.sort((a, b) => b.spend - a.spend),
    byFormat: Object.entries(byFormat).map(([format, data]) => ({ format, ...data })),
    byAngle: Object.entries(byAngle).map(([angleType, data]) => ({ angleType, ...data })),
    byAvatar: Object.entries(byAvatar).map(([avatarName, data]) => ({ avatarName, ...data })),
  })
}
