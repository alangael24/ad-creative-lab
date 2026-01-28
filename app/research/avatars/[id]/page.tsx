import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AvatarDetail } from '@/components/research/AvatarDetail'
import { ResearchList } from '@/components/research/ResearchList'
import { prisma } from '@/lib/db'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'

async function getAvatar(id: string) {
  const avatar = await prisma.avatar.findUnique({
    where: { id },
    include: {
      research: {
        orderBy: { createdAt: 'desc' },
      },
      ads: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          concept: true,
          status: true,
          result: true,
          thumbnailUrl: true,
        },
      },
    },
  })

  return avatar
}

export default async function AvatarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const avatar = await getAvatar(id)

  if (!avatar) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/research"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Volver a Research
        </Link>
        <Link href={`/research/avatars/${id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Editar Avatar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Details - Left Column */}
        <div className="lg:col-span-1">
          <AvatarDetail avatar={avatar} />
        </div>

        {/* Research Items - Right Column */}
        <div className="lg:col-span-2">
          <ResearchList
            avatarId={avatar.id}
            avatarName={avatar.name}
            items={avatar.research}
          />
        </div>
      </div>
    </div>
  )
}
