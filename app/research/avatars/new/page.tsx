import { AvatarForm } from '@/components/research/AvatarForm'

export default function NewAvatarPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nuevo Avatar</h1>
        <p className="text-muted-foreground mt-1">
          Define exactamente a quién le hablas - no demografía genérica, sino su realidad diaria
        </p>
      </div>
      <AvatarForm />
    </div>
  )
}
