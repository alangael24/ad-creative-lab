import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// POST /api/tiktok/session/[id]/classify - Run AI classification on unclassified comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {

    // Fetch session with avatar data for context
    const session = await prisma.tikTokScanSession.findUnique({
      where: { id },
      include: {
        avatar: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    // Fetch all comments where category is null
    const unclassified = await prisma.tikTokComment.findMany({
      where: {
        sessionId: id,
        category: null,
      },
    })

    if (unclassified.length === 0) {
      return NextResponse.json({ message: 'No hay comentarios sin clasificar', classified: 0 })
    }

    // Update session status to classifying
    await prisma.tikTokScanSession.update({
      where: { id },
      data: { status: 'classifying' },
    })

    // Build avatar context for the prompt
    const avatarContext = session.avatar
      ? `
Avatar context:
- Name: ${session.avatar.name}
- Pain points: ${session.avatar.painPoints}
- Desires: ${session.avatar.desires}
- Objections: ${session.avatar.objections || 'N/A'}
- Language patterns: ${session.avatar.language || 'N/A'}`
      : 'No avatar context provided. Classify based on general market research value.'

    const systemPrompt = `You are an expert at analyzing TikTok comments to extract market research insights.

${avatarContext}

Classify each comment into one of these categories:
- pain_point: The comment expresses a problem, frustration, or struggle related to the avatar's pain points
- desire: The comment expresses a want, aspiration, or goal related to the avatar's desires
- objection: The comment expresses doubt, skepticism, or resistance
- language: The comment contains interesting language/phrases the avatar uses (slang, expressions)
- neutral: The comment is not relevant to market research

For each comment, provide:
1. category (one of the above)
2. sentiment (positive/negative/neutral)
3. relevanceScore (0-100, how relevant is this to the avatar)

Return a JSON array matching the input order. Each element should have: { "category": string, "sentiment": string, "relevanceScore": number }
Return ONLY the JSON array, no other text.`

    // Prepare comments for classification (batch in groups of 50 to avoid token limits)
    const batchSize = 50
    const allClassifications: Array<{
      category: string
      sentiment: string
      relevanceScore: number
    }> = []

    for (let i = 0; i < unclassified.length; i += batchSize) {
      const batch = unclassified.slice(i, i + batchSize)
      const commentsText = batch
        .map((c, idx) => `${idx + 1}. @${c.username}: "${c.commentText}"`)
        .join('\n')

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Classify these ${batch.length} TikTok comments:\n\n${commentsText}`,
          },
        ],
        system: systemPrompt,
      })

      // Extract text from response
      const responseText = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')

      // Parse JSON response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('Failed to parse AI classification response')
      }

      const classifications = JSON.parse(jsonMatch[0])
      allClassifications.push(...classifications)
    }

    // Update all comments in DB with classifications
    const updatePromises = unclassified.map((comment, idx) => {
      const classification = allClassifications[idx]
      if (!classification) return null

      return prisma.tikTokComment.update({
        where: { id: comment.id },
        data: {
          category: classification.category,
          sentiment: classification.sentiment,
          relevanceScore: classification.relevanceScore,
        },
      })
    }).filter(Boolean)

    await Promise.all(updatePromises)

    // Update session status to completed
    await prisma.tikTokScanSession.update({
      where: { id },
      data: { status: 'completed' },
    })

    // Fetch updated comments to return
    const classifiedComments = await prisma.tikTokComment.findMany({
      where: { sessionId: id },
      orderBy: [
        { relevanceScore: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({
      classified: allClassifications.length,
      comments: classifiedComments,
    })
  } catch (error) {
    console.error('Error classifying TikTok comments:', error)

    // Mark session as failed
    await prisma.tikTokScanSession.update({
      where: { id },
      data: { status: 'failed' },
    }).catch(() => {})

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al clasificar comentarios' },
      { status: 500 }
    )
  }
}
