"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteAdButtonProps {
  adId: string
  adName: string
}

export function DeleteAdButton({ adId, adName }: DeleteAdButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/ads/${adId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al borrar')
      }

      router.push('/board')
      router.refresh()
    } catch (error) {
      console.error(error)
      setIsDeleting(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Borrar &quot;{adName}&quot;?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Si, borrar'
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
        >
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive"
      onClick={() => setShowConfirm(true)}
    >
      <Trash2 className="h-4 w-4 mr-1" />
      Borrar
    </Button>
  )
}
