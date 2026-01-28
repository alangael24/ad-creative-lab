import { AvatarList } from '@/components/research/AvatarList'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

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

  return {
    totalItems,
    byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
      </div>

      <AvatarList avatars={avatars} />
    </div>
  )
}
