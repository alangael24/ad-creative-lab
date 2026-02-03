import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        learnings: true,
      },
    })
    return NextResponse.json(ads)
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ error: 'Error fetching ads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      name,
      concept,
      hypothesis,
      angleType,
      angleDetail,
      awareness,
      format,
      funnelStage,
      product,
      sourceType,
      sourceUrl,
      referenceMediaUrl,
      status,
      testingBudget,
      thumbnailUrl,
      dueDate,
      avatarId,
      subAvatarId,
    } = body

    // Validation
    if (!concept?.trim()) {
      return NextResponse.json({ error: 'El concepto es obligatorio' }, { status: 400 })
    }

    // Hypothesis only required for non-ideas
    if (status !== 'idea' && !hypothesis?.trim()) {
      return NextResponse.json({ error: 'La hipotesis es obligatoria para produccion' }, { status: 400 })
    }

    const ad = await prisma.ad.create({
      data: {
        name: name || `${new Date().toISOString().split('T')[0]}_${concept}`,
        concept,
        hypothesis: hypothesis || '',
        angleType: angleType || 'fear',
        angleDetail: angleDetail || null,
        awareness: awareness || 'unaware',
        format: format || 'static',
        funnelStage: funnelStage || 'cold',
        product: product || null,
        sourceType: sourceType || 'original',
        sourceUrl: sourceUrl || null,
        referenceMediaUrl: referenceMediaUrl || null,
        status: status || 'idea',
        testingBudget: testingBudget || 50,
        thumbnailUrl: thumbnailUrl || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        avatarId: avatarId || null,
        subAvatarId: subAvatarId || null,
      },
    })

    return NextResponse.json(ad, { status: 201 })
  } catch (error) {
    console.error('Error creating ad:', error)
    return NextResponse.json({ error: 'Error creating ad' }, { status: 500 })
  }
}
