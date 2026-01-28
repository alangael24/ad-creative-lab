import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AvatarForm } from '@/components/research/AvatarForm'
import { prisma } from '@/lib/db'
import { ArrowLeft } from 'lucide-react'

async function getAvatar(id: string) {
  const avatar = await prisma.avatar.findUnique({
    where: { id },
  })

  return avatar
}

export default async function EditAvatarPage({
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
    <div className="max-w-4xl mx-auto p-6">
      <Link
        href={`/research/avatars/${id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Volver al Avatar
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Avatar</h1>
        <p className="text-muted-foreground mt-1">
          Actualiza la información de {avatar.name}
        </p>
      </div>

      <AvatarForm avatar={avatar} />
    </div>
  )
}
