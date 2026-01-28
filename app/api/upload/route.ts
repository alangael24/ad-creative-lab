import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se ha enviado ningun archivo' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se permiten videos (mp4, webm, mov) e imagenes (jpg, png, gif, webp)' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Maximo 100MB.' },
        { status: 400 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'mp4'
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filepath = path.join(uploadsDir, filename)

    // Write file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Return the public URL
    const url = `/uploads/${filename}`

    return NextResponse.json({ url, filename }, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
  }
}
