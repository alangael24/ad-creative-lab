import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { runScoutAgent } from '@/lib/scout-agent'

// POST /api/scout/session/[id]/run - Execute the scout agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Fetch session with avatar data
  const session = await prisma.scoutSession.findUnique({
    where: { id },
    include: {
      avatar: true,
    },
  })

  if (!session) {
    return new Response(JSON.stringify({ error: 'Sesión no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (session.status === 'completed') {
    return new Response(JSON.stringify({ error: 'Esta sesión ya fue completada' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // SSE stream for progress updates
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      try {
        send('status', { message: 'Iniciando Scout...', phase: 'starting' })

        // Run the scout agent
        const findings = await runScoutAgent({
          session,
          avatar: session.avatar,
          onProgress: (message: string, phase: string) => {
            send('progress', { message, phase })
          },
        })

        // Save findings to database
        send('status', { message: 'Guardando hallazgos...', phase: 'saving' })

        if (findings.length > 0) {
          await prisma.scoutFinding.createMany({
            data: findings.map((f) => ({
              sessionId: id,
              type: f.type,
              content: f.content,
              sourceUrl: f.sourceUrl || null,
              creator: f.creator || null,
              engagement: f.engagement ? JSON.stringify(f.engagement) : null,
              relevance: f.relevance,
              relevanceReason: f.relevanceReason,
              category: f.category,
              thumbnailUrl: f.thumbnailUrl || null,
            })),
          })
        }

        // Update session status
        await prisma.scoutSession.update({
          where: { id },
          data: {
            status: 'completed',
            totalFindings: findings.length,
          },
        })

        send('complete', {
          message: `Scout completado. ${findings.length} hallazgos encontrados.`,
          totalFindings: findings.length,
        })
      } catch (error) {
        console.error('Scout agent error:', error)

        // Mark session as failed
        await prisma.scoutSession.update({
          where: { id },
          data: { status: 'failed' },
        })

        send('error', {
          message: error instanceof Error ? error.message : 'Error durante el escaneo',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
