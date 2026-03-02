import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/scout/session/[id] - Get session with findings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await prisma.scoutSession.findUnique({
      where: { id },
      include: {
        avatar: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        findings: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching scout session:', error)
    return NextResponse.json({ error: 'Error al obtener sesión' }, { status: 500 })
  }
}

// DELETE /api/scout/session/[id] - Delete a session and its findings
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Cascade delete will remove findings too
    await prisma.scoutSession.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting scout session:', error)
    return NextResponse.json({ error: 'Error al eliminar sesión' }, { status: 500 })
  }
}
