import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { recalculateAdTotals } from '@/lib/metrics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const metrics = await prisma.dailyMetric.findMany({
    where: { adId: id },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(metrics)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const date = new Date(body.date + 'T00:00:00.000Z')

  try {
    const metric = await prisma.dailyMetric.create({
      data: {
        adId: id,
        date,
        spend: body.spend || 0,
        impressions: body.impressions || 0,
        clicks: body.clicks || 0,
        purchases: body.purchases || 0,
        revenue: body.revenue || 0,
        videoViewThreeSeconds: body.videoViewThreeSeconds || 0,
        videoViewThruplay: body.videoViewThruplay || 0,
      },
    })

    await recalculateAdTotals(id)

    return NextResponse.json(metric, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una entrada para esta fecha' },
        { status: 409 }
      )
    }
    throw error
  }
}
