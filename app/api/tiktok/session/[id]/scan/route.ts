import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getTikTokScraper, closeTikTokScraper } from '@/lib/tiktok-scraper'
import type { ScrapeProgress, ExtractedComment, ExtractedVideo } from '@/lib/tiktok-scraper'

// POST /api/tiktok/session/[id]/scan - Run automated Playwright scan with SSE progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Fetch session
  const session = await prisma.tikTokScanSession.findUnique({
    where: { id },
    include: {
      avatar: true,
    },
  })

  if (!session) {
    return new Response(JSON.stringify({ error: 'Sesion no encontrada' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      const onProgress = (progress: ScrapeProgress) => {
        sendEvent('progress', {
          phase: progress.phase,
          message: progress.message,
          count: progress.count || 0,
        })
      }

      try {
        // Update session status
        await prisma.tikTokScanSession.update({
          where: { id },
          data: { status: 'scanning' },
        })
        sendEvent('status', { status: 'scanning' })

        // Initialize scraper
        const scraper = await getTikTokScraper(onProgress)

        let comments: ExtractedComment[] = []
        let videos: ExtractedVideo[] = []

        // Run extraction based on scan type
        switch (session.scanType) {
          case 'comments': {
            comments = await scraper.extractComments(
              session.sourceUrl,
              500,
              onProgress,
            )
            break
          }

          case 'search': {
            videos = await scraper.extractSearchResults(
              session.query || '',
              50,
              onProgress,
            )
            break
          }

          case 'profile': {
            const result = await scraper.extractCreatorProfile(
              session.sourceUrl,
              30,
              onProgress,
            )
            videos = result.videos
            break
          }

          case 'feed': {
            videos = await scraper.extractFeedVideos(30, onProgress)
            break
          }
        }

        // Save extracted data to DB
        sendEvent('progress', {
          phase: 'saving',
          message: 'Guardando datos en la base de datos...',
          count: comments.length + videos.length,
        })

        // Save comments
        if (comments.length > 0) {
          await prisma.tikTokComment.createMany({
            data: comments.map(c => ({
              sessionId: id,
              username: c.username,
              commentText: c.commentText,
              likes: c.likes,
              timestamp: c.timestamp || null,
              replyTo: c.replyTo,
              videoUrl: c.videoUrl,
              avatarId: session.avatarId,
            })),
          })
        }

        // Save videos
        if (videos.length > 0) {
          await prisma.tikTokVideo.createMany({
            data: videos.map(v => ({
              sessionId: id,
              videoUrl: v.videoUrl,
              description: v.description,
              hashtags: JSON.stringify(v.hashtags),
              creator: v.creator,
              views: v.views,
              likes: v.likes,
              shares: v.shares,
              commentsCount: v.commentsCount,
              thumbnailUrl: v.thumbnailUrl,
              musicTitle: v.musicTitle,
              avatarId: session.avatarId,
            })),
          })
        }

        const totalItems = comments.length + videos.length

        // Update session
        await prisma.tikTokScanSession.update({
          where: { id },
          data: {
            totalItems,
            status: 'completed',
          },
        })

        sendEvent('progress', {
          phase: 'saved',
          message: `${totalItems} items guardados`,
          count: totalItems,
        })

        // Auto-classify if avatar is linked and we have comments
        if (session.avatarId && comments.length > 0) {
          sendEvent('progress', {
            phase: 'classifying',
            message: 'Clasificando comentarios con IA...',
            count: comments.length,
          })

          try {
            // Trigger classification
            const classifyUrl = new URL(
              `/api/tiktok/session/${id}/classify`,
              request.url,
            )
            await fetch(classifyUrl.toString(), { method: 'POST' })

            sendEvent('progress', {
              phase: 'classified',
              message: 'Clasificacion completada!',
              count: comments.length,
            })
          } catch (classifyError) {
            sendEvent('progress', {
              phase: 'classify_error',
              message: 'Error al clasificar (puedes hacerlo manualmente)',
            })
          }
        }

        sendEvent('complete', {
          comments: comments.length,
          videos: videos.length,
          total: totalItems,
        })
      } catch (error) {
        console.error('Scan error:', error)

        await prisma.tikTokScanSession.update({
          where: { id },
          data: { status: 'failed' },
        }).catch(() => {})

        sendEvent('error', {
          message: error instanceof Error ? error.message : 'Error durante el scan',
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
