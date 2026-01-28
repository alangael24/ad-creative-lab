import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HitRateGauge } from '@/components/dashboard/HitRateGauge'
import { MoneyInLimbo } from '@/components/dashboard/MoneyInLimbo'
import { ActionAlerts } from '@/components/dashboard/ActionAlerts'
import { DueDateAlerts } from '@/components/dashboard/DueDateAlerts'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { prisma } from '@/lib/db'

async function getStats() {
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

  // Auto-move expired testing ads to analysis
  const now = new Date()
  await prisma.ad.updateMany({
    where: {
      status: 'testing',
      reviewDate: { lte: now },
    },
    data: {
      status: 'analysis',
      isLocked: false,
    },
  })

  // Get ads in analysis status
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

  // Get overdue ads (dueDate passed, not completed)
  const overdueAds = await prisma.ad.findMany({
    where: {
      dueDate: { lt: now },
      status: { notIn: ['completed', 'analysis'] },
    },
    select: {
      id: true,
      name: true,
      concept: true,
      dueDate: true,
      status: true,
    },
    orderBy: { dueDate: 'asc' },
  })

  // Get ads due soon (next 3 days, not completed)
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const dueSoonAds = await prisma.ad.findMany({
    where: {
      dueDate: { gte: now, lte: threeDaysFromNow },
      status: { notIn: ['completed', 'analysis'] },
    },
    select: {
      id: true,
      name: true,
      concept: true,
      dueDate: true,
      status: true,
    },
    orderBy: { dueDate: 'asc' },
  })

  return {
    hitRate,
    totalAnalyzed,
    winners,
    moneyInLimbo,
    testingCount: testingAds.length,
    adsReadyForAnalysis: analysisAds,
    trendData,
    adsByStatus,
    overdueAds: overdueAds.map(ad => ({
      ...ad,
      dueDate: ad.dueDate!.toISOString(),
    })),
    dueSoonAds: dueSoonAds.map(ad => ({
      ...ad,
      dueDate: ad.dueDate!.toISOString(),
    })),
  }
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Hit Rate Gauge */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Hit Rate</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <HitRateGauge
              hitRate={stats.hitRate}
              totalAds={stats.totalAnalyzed}
              winners={stats.winners}
            />
          </CardContent>
        </Card>

        {/* Money in Limbo & Alerts */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Estado Actual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MoneyInLimbo
              totalBudget={stats.moneyInLimbo}
              adsCount={stats.testingCount}
            />
            <DueDateAlerts
              overdueAds={stats.overdueAds}
              dueSoonAds={stats.dueSoonAds}
            />
            <ActionAlerts
              adsReadyForAnalysis={stats.adsReadyForAnalysis.map(ad => ({
                ...ad,
                reviewDate: ad.reviewDate?.toISOString() || null,
              }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Hit Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={stats.trendData} />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Ideas</p>
            <p className="text-2xl font-bold">{stats.adsByStatus.idea || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En Produccion</p>
            <p className="text-2xl font-bold">{stats.adsByStatus.production || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">En Testeo</p>
            <p className="text-2xl font-bold">{stats.adsByStatus.testing || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Completados</p>
            <p className="text-2xl font-bold">{stats.adsByStatus.completed || 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
