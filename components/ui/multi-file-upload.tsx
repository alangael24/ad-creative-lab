"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface UploadedFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

interface MultiFileUploadProps {
  onUploadComplete: (files: Array<{ mediaUrl: string; mediaType: string }>) => void
  accept?: string
  maxSize?: number // in MB
  maxFiles?: number
}

export function MultiFileUpload({
  onUploadComplete,
  accept = "video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/gif,image/webp",
  maxSize = 100,
  maxFiles = 20,
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    const newFiles: UploadedFile[] = selectedFiles
      .slice(0, maxFiles - files.length)
      .map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const,
      }))

    setFiles((prev) => [...prev, ...newFiles])

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const uploadedFiles: Array<{ mediaUrl: string; mediaType: string }> = []

    for (const fileData of files) {
      if (fileData.status === 'success') {
        // Already uploaded
        if (fileData.url) {
          uploadedFiles.push({
            mediaUrl: fileData.url,
            mediaType: fileData.file.type.startsWith('video/') ? 'video' : 'image',
          })
        }
        continue
      }

      // Check file size
      if (fileData.file.size > maxSize * 1024 * 1024) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: 'error' as const, error: `Archivo muy grande (max ${maxSize}MB)` }
              : f
          )
        )
        continue
      }

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileData.id ? { ...f, status: 'uploading' as const } : f
        )
      )

      try {
        const formData = new FormData()
        formData.append('file', fileData.file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()

        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: 'success' as const, url: data.url }
              : f
          )
        )

        uploadedFiles.push({
          mediaUrl: data.url,
          mediaType: fileData.file.type.startsWith('video/') ? 'video' : 'image',
        })
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: 'error' as const, error: 'Error al subir' }
              : f
          )
        )
      }
    }

    setIsUploading(false)

    if (uploadedFiles.length > 0) {
      onUploadComplete(uploadedFiles)
    }
  }

  const successCount = files.filter((f) => f.status === 'success').length
  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Click para seleccionar archivos o arrastra aquí
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Máximo {maxFiles} archivos, {maxSize}MB cada uno
        </p>
      </div>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado{files.length !== 1 ? 's' : ''}
              {successCount > 0 && ` (${successCount} subido${successCount !== 1 ? 's' : ''})`}
            </p>
            {files.length < maxFiles && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                Agregar más
              </Button>
            )}
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {files.map((fileData) => (
              <div
                key={fileData.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
              >
                {fileData.file.type.startsWith('video/') ? (
                  <video
                    src={fileData.preview}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={fileData.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Status Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center ${
                  fileData.status === 'uploading' ? 'bg-black/50' :
                  fileData.status === 'success' ? 'bg-green-500/30' :
                  fileData.status === 'error' ? 'bg-red-500/30' :
                  ''
                }`}>
                  {fileData.status === 'uploading' && (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  )}
                  {fileData.status === 'success' && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {fileData.status === 'error' && (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  )}
                </div>

                {/* Remove Button */}
                {fileData.status !== 'uploading' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(fileData.id)
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                )}

                {/* Error Message */}
                {fileData.error && (
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-red-500 text-white text-[10px] text-center truncate">
                    {fileData.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload Button */}
          {pendingCount > 0 && (
            <Button
              onClick={uploadFiles}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir {pendingCount} archivo{pendingCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
