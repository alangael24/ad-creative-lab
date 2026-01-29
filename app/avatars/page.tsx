import Link from 'next/link'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Plus, Play, FileText, Video } from 'lucide-react'

async function getAvatars() {
  const avatars = await prisma.avatar.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          nativeContent: true,
          research: true,
          ads: true,
        },
      },
      nativeContent: {
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          thumbnailUrl: true,
        },
      },
    },
  })

  return avatars
}

export default async function AvatarsPage() {
  const avatars = await getAvatars()

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Avatares</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus avatares y el contenido nativo que consumen
          </p>
        </div>
        <Link href="/research/avatars/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Avatar
          </Button>
        </Link>
      </div>

      {avatars.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No hay avatares creados aún
          </p>
          <Link href="/research/avatars/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Crear primer avatar
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {avatars.map((avatar) => (
            <Link
              key={avatar.id}
              href={`/research/avatars/${avatar.id}`}
              className="block"
            >
              <div className="border rounded-lg overflow-hidden hover:border-primary transition-colors">
                {/* Content Preview */}
                {avatar.nativeContent.length > 0 ? (
                  <div className="grid grid-cols-4 gap-0.5 h-24 bg-muted">
                    {avatar.nativeContent.slice(0, 4).map((content, index) => (
                      <div key={content.id} className="relative overflow-hidden">
                        {content.mediaType === 'video' ? (
                          <>
                            <video
                              src={content.mediaUrl}
                              className="w-full h-24 object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <img
                            src={content.mediaUrl}
                            alt=""
                            className="w-full h-24 object-cover"
                          />
                        )}
                        {index === 3 && avatar._count.nativeContent > 4 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm font-medium">
                            +{avatar._count.nativeContent - 4}
                          </div>
                        )}
                      </div>
                    ))}
                    {avatar.nativeContent.length < 4 &&
                      Array.from({ length: 4 - avatar.nativeContent.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-muted" />
                      ))}
                  </div>
                ) : (
                  <div className="h-24 bg-muted flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Sin contenido</p>
                  </div>
                )}

                {/* Avatar Info */}
                <div className="p-4">
                  <h3 className="font-semibold truncate">{avatar.name}</h3>
                  {avatar.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {avatar.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      <span>{avatar._count.nativeContent} contenidos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{avatar._count.research} research</span>
                    </div>
                  </div>

                  {/* Demographics */}
                  {(avatar.ageRange || avatar.gender || avatar.location) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {avatar.ageRange && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          {avatar.ageRange} años
                        </span>
                      )}
                      {avatar.gender && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          {avatar.gender === 'female' ? 'Mujer' : avatar.gender === 'male' ? 'Hombre' : 'Todos'}
                        </span>
                      )}
                      {avatar.location && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          {avatar.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
