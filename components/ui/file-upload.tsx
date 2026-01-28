"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X, Film, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "./button"

interface FileUploadProps {
  value?: string
  onChange: (url: string | null) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

export function FileUpload({
  value,
  onChange,
  accept = "video/*,image/*",
  maxSize = 100,
  className,
  disabled,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(null)

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`El archivo es demasiado grande. Maximo ${maxSize}MB.`)
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al subir el archivo')
      }

      const data = await response.json()
      onChange(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleRemove = () => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const isVideo = value?.match(/\.(mp4|webm|mov)$/i)
  const isImage = value?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  if (value) {
    return (
      <div className={cn("relative rounded-lg border bg-muted/30 overflow-hidden", className)}>
        {isVideo ? (
          <video
            src={value}
            controls
            className="w-full max-h-64 object-contain"
          />
        ) : isImage ? (
          <img
            src={value}
            alt="Referencia"
            className="w-full max-h-64 object-contain"
          />
        ) : (
          <div className="p-4 flex items-center gap-2">
            <Film className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm truncate flex-1">{value}</span>
          </div>
        )}
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={handleRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Subiendo...</p>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Film className="h-6 w-6 text-muted-foreground" />
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Arrastra un video o imagen aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  o haz clic para seleccionar (max {maxSize}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
