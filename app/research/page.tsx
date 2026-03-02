import { AvatarList } from '@/components/research/AvatarList'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Radar, Chrome } from 'lucide-react'

async function getAvatars() {
  const avatars = await prisma.avatar.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: {
          research: true,
          ads: true,
        },
      },
    },
  })

  return avatars.map(avatar => ({
    ...avatar,
    painPoints: avatar.painPoints,
    desires: avatar.desires,
    objections: avatar.objections,
    researchCount: avatar._count.research,
    adsCount: avatar._count.ads,
  }))
}

async function getResearchStats() {
  const totalItems = await prisma.researchItem.count()
  const byCategory = await prisma.researchItem.groupBy({
    by: ['category'],
    _count: true,
  })
  const insightsCount = await prisma.insight.count()
  const scoutSessionsCount = await prisma.scoutSession.count()
  const tiktokSessionsCount = await prisma.tikTokScanSession.count()

  return {
    totalItems,
    byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
    insightsCount,
    scoutSessionsCount,
    tiktokSessionsCount,
  }
}

export default async function ResearchPage() {
  const avatars = await getAvatars()
  const stats = await getResearchStats()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Laboratorio de Empatía</h1>
          <p className="text-muted-foreground mt-1">
            Define a quién le hablas y recopila su lenguaje real
          </p>
        </div>
        <Link href="/research/avatars/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Avatar
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Avatars</p>
          <p className="text-2xl font-bold">{avatars.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Research Items</p>
          <p className="text-2xl font-bold">{stats.totalItems}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">Pain Points</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.byCategory.pain_point || 0}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-600 dark:text-green-400">Deseos</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.byCategory.desire || 0}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-600 dark:text-blue-400">Lenguaje</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.byCategory.language || 0}</p>
        </div>
        <Link href="/research/insights" className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 hover:border-purple-400 transition-colors">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" />
            <p className="text-sm text-purple-600 dark:text-purple-400">Insights</p>
          </div>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.insightsCount}</p>
        </Link>
        <Link href="/research/scout" className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 hover:border-cyan-400 transition-colors">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-cyan-500" />
            <p className="text-sm text-cyan-600 dark:text-cyan-400">Scout</p>
          </div>
          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.scoutSessionsCount}</p>
        </Link>
        <Link href="/research/tiktok" className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:border-orange-400 transition-colors">
          <div className="flex items-center gap-2">
            <Chrome className="h-4 w-4 text-orange-500" />
            <p className="text-sm text-orange-600 dark:text-orange-400">TikTok</p>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.tiktokSessionsCount}</p>
        </Link>
      </div>

      <AvatarList avatars={avatars} />
    </div>
  )
}
