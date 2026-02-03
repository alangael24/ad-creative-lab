import { NextRequest, NextResponse } from 'next/server'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { prisma } from '@/lib/db'

// Function to get all the data needed for reports
async function getReportData() {
  const [allAds, completedAds, testingAds, learnings] = await Promise.all([
    prisma.ad.findMany({
      orderBy: { createdAt: 'desc' },
      include: { learnings: true },
    }),
    prisma.ad.findMany({
      where: { status: 'completed' },
      orderBy: { closedAt: 'desc' },
    }),
    prisma.ad.findMany({
      where: { status: 'testing' },
    }),
    prisma.learning.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  // Calculate stats
  const totalAds = allAds.length
  const winners = completedAds.filter(ad => ad.result === 'winner').length
  const losers = completedAds.filter(ad => ad.result === 'loser').length
  const hitRate = completedAds.length > 0 ? (winners / completedAds.length) * 100 : 0

  // Stats by angle
  const angleStats = completedAds.reduce((acc, ad) => {
    if (!acc[ad.angleType]) {
      acc[ad.angleType] = { total: 0, winners: 0, totalSpend: 0, totalRevenue: 0 }
    }
    acc[ad.angleType].total++
    if (ad.result === 'winner') acc[ad.angleType].winners++
    if (ad.spend) acc[ad.angleType].totalSpend += ad.spend
    if (ad.revenue) acc[ad.angleType].totalRevenue += ad.revenue
    return acc
  }, {} as Record<string, { total: number; winners: number; totalSpend: number; totalRevenue: number }>)

  // Stats by format
  const formatStats = completedAds.reduce((acc, ad) => {
    if (!acc[ad.format]) {
      acc[ad.format] = { total: 0, winners: 0, totalSpend: 0, totalRevenue: 0 }
    }
    acc[ad.format].total++
    if (ad.result === 'winner') acc[ad.format].winners++
    if (ad.spend) acc[ad.format].totalSpend += ad.spend
    if (ad.revenue) acc[ad.format].totalRevenue += ad.revenue
    return acc
  }, {} as Record<string, { total: number; winners: number; totalSpend: number; totalRevenue: number }>)

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentAds = allAds.filter(ad => new Date(ad.createdAt) >= sevenDaysAgo)
  const recentCompleted = completedAds.filter(ad => ad.closedAt && new Date(ad.closedAt) >= sevenDaysAgo)

  // Money in limbo
  const moneyInLimbo = testingAds.reduce((sum, ad) => sum + (ad.testingBudget || 0), 0)

  // Total spend and revenue
  const totalSpend = completedAds.reduce((sum, ad) => sum + (ad.spend || 0), 0)
  const totalRevenue = completedAds.reduce((sum, ad) => sum + (ad.revenue || 0), 0)

  // Ads by status
  const adsByStatus = {
    idea: allAds.filter(ad => ad.status === 'idea').length,
    production: allAds.filter(ad => ad.status === 'production').length,
    testing: allAds.filter(ad => ad.status === 'testing').length,
    analysis: allAds.filter(ad => ad.status === 'analysis').length,
    completed: allAds.filter(ad => ad.status === 'completed').length,
  }

  // Recent learnings
  const recentLearnings = learnings.slice(0, 10).map(l => ({
    content: l.content,
    angleType: l.angleType,
    format: l.format,
    result: l.result,
  }))

  // Ads pending analysis
  const pendingAnalysis = allAds.filter(ad => ad.status === 'analysis').map(ad => ({
    name: ad.name,
    concept: ad.concept,
    angleType: ad.angleType,
    format: ad.format,
  }))

  return {
    summary: {
      totalAds,
      completedAds: completedAds.length,
      winners,
      losers,
      hitRate: hitRate.toFixed(1),
      moneyInLimbo,
      totalSpend,
      totalRevenue,
      overallROAS: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 'N/A',
    },
    adsByStatus,
    angleStats,
    formatStats,
    recentActivity: {
      newAdsLast7Days: recentAds.length,
      completedLast7Days: recentCompleted.length,
    },
    pendingAnalysis,
    recentLearnings,
    sampleAds: allAds.slice(0, 10).map(ad => ({
      name: ad.name,
      concept: ad.concept,
      angleType: ad.angleType,
      format: ad.format,
      status: ad.status,
      result: ad.result,
      hypothesis: ad.hypothesis,
      diagnosis: ad.diagnosis,
      spend: ad.spend,
      revenue: ad.revenue,
    })),
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query: userQuery } = await request.json()

    if (!userQuery?.trim()) {
      return NextResponse.json({ error: 'La consulta es requerida' }, { status: 400 })
    }

    // Get all report data
    const reportData = await getReportData()

    const systemContext = `Eres un analista experto en publicidad digital. Analiza estos datos y responde en espanol de forma concisa y accionable.

DATOS DEL SISTEMA AD CREATIVE LAB:
${JSON.stringify(reportData, null, 2)}

CONTEXTO:
- "Hit Rate" = % de anuncios winners del total analizado
- "Winner" = anuncio rentable, "Loser" = no rentable
- Angulos: fear, desire, curiosity, offer, tutorial, testimonial
- Formatos: static, video, ugc, carousel
- "Money in Limbo" = presupuesto en testeo activo

Responde usando markdown. Se conciso pero completo.`

    const fullPrompt = `${systemContext}

PREGUNTA DEL USUARIO: ${userQuery}`

    let reportText = ''

    // Use Claude Agent SDK
    const queryIterator = query({
      prompt: fullPrompt,
      options: {
        tools: [], // No tools needed, just text response
        allowedTools: [],
      },
    })

    for await (const message of queryIterator) {
      if (message.type === 'assistant') {
        // Extract text from the assistant message
        for (const block of message.message.content) {
          if ('text' in block) {
            reportText += block.text
          }
        }
      }
    }

    if (!reportText) {
      reportText = 'No se pudo generar el informe. Intenta de nuevo.'
    }

    return NextResponse.json({ report: reportText })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el informe' },
      { status: 500 }
    )
  }
}
