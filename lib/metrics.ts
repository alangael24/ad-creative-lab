import { prisma } from './db'

export async function recalculateAdTotals(adId: string) {
  const aggregates = await prisma.dailyMetric.aggregate({
    where: { adId },
    _sum: {
      spend: true,
      impressions: true,
      clicks: true,
      purchases: true,
      revenue: true,
      videoViewThreeSeconds: true,
      videoViewThruplay: true,
    },
  })

  await prisma.ad.update({
    where: { id: adId },
    data: {
      spend: aggregates._sum.spend || null,
      impressions: aggregates._sum.impressions || null,
      clicks: aggregates._sum.clicks || null,
      purchases: aggregates._sum.purchases || null,
      revenue: aggregates._sum.revenue || null,
      videoViewThreeSeconds: aggregates._sum.videoViewThreeSeconds || null,
      videoViewThruplay: aggregates._sum.videoViewThruplay || null,
    },
  })
}
