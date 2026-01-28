import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await prisma.researchItem.findUnique({
      where: { id },
      include: {
        avatar: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Research item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching research item:', error)
    return NextResponse.json({ error: 'Error fetching research item' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const item = await prisma.researchItem.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating research item:', error)
    return NextResponse.json({ error: 'Error updating research item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.researchItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting research item:', error)
    return NextResponse.json({ error: 'Error deleting research item' }, { status: 500 })
  }
}
