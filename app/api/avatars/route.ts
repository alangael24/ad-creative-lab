import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const avatars = await prisma.avatar.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            research: true,
            ads: true,
          },
        },
      },
    })

    return NextResponse.json(avatars)
  } catch (error) {
    console.error('Error fetching avatars:', error)
    return NextResponse.json({ error: 'Error fetching avatars' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const avatar = await prisma.avatar.create({
      data: {
        name: body.name,
        description: body.description || null,
        painPoints: body.painPoints || '[]',
        desires: body.desires || '[]',
        objections: body.objections || null,
        organicStyle: body.organicStyle || null,
        language: body.language || null,
        ageRange: body.ageRange || null,
        gender: body.gender || null,
        location: body.location || null,
      },
    })

    return NextResponse.json(avatar)
  } catch (error) {
    console.error('Error creating avatar:', error)
    return NextResponse.json({ error: 'Error creating avatar' }, { status: 500 })
  }
}
