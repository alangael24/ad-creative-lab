import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { recalculateAdTotals } from '@/lib/metrics'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; metricId: string }> }
) {
  const { id, metricId } = await params
  const body = await request.json()

  const metric = await prisma.dailyMetric.update({
    where: { id: metricId },
    data: {
      spend: body.spend ?? undefined,
      impressions: body.impressions ?? undefined,
      clicks: body.clicks ?? undefined,
      purchases: body.purchases ?? undefined,
      revenue: body.revenue ?? undefined,
      videoViewThreeSeconds: body.videoViewThreeSeconds ?? undefined,
      videoViewThruplay: body.videoViewThruplay ?? undefined,
    },
  })

  await recalculateAdTotals(id)

  return NextResponse.json(metric)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; metricId: string }> }
) {
  const { id, metricId } = await params

  await prisma.dailyMetric.delete({
    where: { id: metricId },
  })

  await recalculateAdTotals(id)

  return NextResponse.json({ success: true })
}
