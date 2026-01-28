import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { CompetitorDetail } from '@/components/competitors/CompetitorDetail'
import { CompetitorAdGallery } from '@/components/competitors/CompetitorAdGallery'
import { ArrowLeft } from 'lucide-react'

async function getCompetitor(id: string) {
  const competitor = await prisma.competitor.findUnique({
    where: { id },
    include: {
      ads: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return competitor
}

export default async function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const competitor = await getCompetitor(id)

  if (!competitor) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Link
        href="/competitors"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver a Competidores
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Competitor Info - Left Column */}
        <div className="lg:col-span-1">
          <CompetitorDetail competitor={competitor} />
        </div>

        {/* Ads Gallery - Right Column */}
        <div className="lg:col-span-3">
          <CompetitorAdGallery
            competitorId={competitor.id}
            competitorName={competitor.name}
            ads={competitor.ads}
          />
        </div>
      </div>
    </div>
  )
}
