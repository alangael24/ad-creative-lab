import { query } from '@anthropic-ai/claude-agent-sdk'

// Types
type FindingType = 'video' | 'comment' | 'trend' | 'creator'
type Relevance = 'high' | 'medium' | 'low'
type FindingCategory = 'pain_point' | 'desire' | 'objection' | 'language' | 'trend' | 'content_idea'

export interface ScoutFindingData {
  type: FindingType
  content: string
  sourceUrl?: string
  creator?: string
  engagement?: { likes?: number; comments?: number; shares?: number; views?: number }
  relevance: Relevance
  relevanceReason: string
  category: FindingCategory
  thumbnailUrl?: string
}

interface AvatarData {
  id: string
  name: string
  painPoints: string
  desires: string
  objections: string | null
  language: string | null
  organicStyle: string | null
  ageRange: string | null
  gender: string | null
  location: string | null
  description: string | null
}

interface SessionData {
  id: string
  query: string
  context: string | null
}

interface RunScoutOptions {
  session: SessionData
  avatar: AvatarData
  onProgress: (message: string, phase: string) => void
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return value ? [value] : []
  }
}

function buildAvatarContext(avatar: AvatarData): string {
  const painPoints = parseJsonArray(avatar.painPoints)
  const desires = parseJsonArray(avatar.desires)
  const objections = parseJsonArray(avatar.objections)

  const parts: string[] = []
  parts.push(`NOMBRE: ${avatar.name}`)
  if (avatar.description) parts.push(`DESCRIPCIÓN: ${avatar.description}`)

  const demos: string[] = []
  if (avatar.ageRange) demos.push(`Edad: ${avatar.ageRange}`)
  if (avatar.gender) demos.push(`Género: ${avatar.gender}`)
  if (avatar.location) demos.push(`Ubicación: ${avatar.location}`)
  if (demos.length > 0) parts.push(`DEMOGRÁFICOS: ${demos.join(' | ')}`)

  if (painPoints.length > 0) {
    parts.push(`\nPAIN POINTS (dolores/frustraciones):`)
    painPoints.forEach((p, i) => parts.push(`  ${i + 1}. "${p}"`))
  }

  if (desires.length > 0) {
    parts.push(`\nDESEOS (lo que quiere lograr):`)
    desires.forEach((d, i) => parts.push(`  ${i + 1}. "${d}"`))
  }

  if (objections.length > 0) {
    parts.push(`\nOBJECIONES (resistencias):`)
    objections.forEach((o, i) => parts.push(`  ${i + 1}. "${o}"`))
  }

  if (avatar.language) parts.push(`\nLENGUAJE QUE USA: "${avatar.language}"`)
  if (avatar.organicStyle) parts.push(`\nESTILO DE CONTENIDO QUE CONSUME: ${avatar.organicStyle}`)

  return parts.join('\n')
}

const SCOUT_SYSTEM_PROMPT = `Eres un analista experto en investigación de mercado y social listening especializado en TikTok. Tu trabajo es hacer investigación REAL buscando en internet para encontrar contenido de TikTok relevante para un avatar específico.

## INSTRUCCIONES DE BÚSQUEDA

Tienes acceso a WebSearch y WebFetch. DEBES usarlos para buscar contenido REAL. Haz MÍNIMO 5 búsquedas diferentes para cubrir múltiples ángulos:

1. Busca pain points del avatar en TikTok:
   - "site:tiktok.com [keywords del pain point]"
   - "[pain point] tiktok viral"

2. Busca deseos y aspiraciones:
   - "tiktok [tema aspiracional] transformation"
   - "[deseo del avatar] tiktok trend"

3. Busca lenguaje y comentarios:
   - "[frases del avatar] tiktok comments"
   - "tiktok [nicho] relatable"

4. Busca creadores relevantes:
   - "tiktok creator [nicho] popular"
   - "best tiktok accounts [tema]"

5. Busca tendencias:
   - "tiktok trend [tema] 2025 2026"
   - "[nicho] tiktok format viral"

Si el avatar habla español, incluye búsquedas en español también.

Usa WebFetch para analizar las páginas de resultados cuando encuentres URLs prometedoras.

## CLASIFICACIÓN DE HALLAZGOS

Para cada hallazgo encontrado, clasifícalo:

**Tipos:** video | comment | trend | creator
**Categorías:** pain_point | desire | objection | language | trend | content_idea
**Relevancia:** high (conecta directamente) | medium (relacionado) | low (tangencial)

## OUTPUT

Después de completar TODA tu investigación, responde con JSON en este formato exacto:

{
  "findings": [
    {
      "type": "video",
      "content": "Descripción detallada del video, su hook, concepto, y por qué resonaría",
      "sourceUrl": "URL real de TikTok si la encontraste",
      "creator": "@handle del creador",
      "engagement": {"likes": 12500, "comments": 890, "shares": 234, "views": 156000},
      "relevance": "high",
      "relevanceReason": "Conecta directamente con el pain point X del avatar porque...",
      "category": "pain_point"
    }
  ],
  "searchQueries": ["búsquedas que realizaste"],
  "summary": "Resumen de 2-3 oraciones sobre los hallazgos principales"
}

REGLAS:
- Haz la investigación REAL con WebSearch antes de generar el JSON
- Incluye 8-15 hallazgos variados (mix de tipos y categorías)
- Cada hallazgo debe explicar por qué es relevante para ESTE avatar
- Usa URLs reales cuando las encuentres
- Todo en español`

export async function runScoutAgent({
  session,
  avatar,
  onProgress,
}: RunScoutOptions): Promise<ScoutFindingData[]> {
  const avatarContext = buildAvatarContext(avatar)

  onProgress('Preparando agente de investigación...', 'starting')

  const userPrompt = `## AVATAR A INVESTIGAR

${avatarContext}

## MISIÓN

Búsqueda: "${session.query}"
${session.context ? `Contexto adicional: ${session.context}` : ''}

Investiga TikTok usando WebSearch y WebFetch para encontrar contenido relevante para este avatar. Busca videos, comentarios, tendencias y creadores que conecten con sus pain points y deseos. Haz múltiples búsquedas desde diferentes ángulos. Al terminar, responde SOLO con el JSON de hallazgos.`

  let responseText = ''

  const queryIterator = query({
    prompt: userPrompt,
    options: {
      systemPrompt: SCOUT_SYSTEM_PROMPT,
      tools: ['WebSearch', 'WebFetch'],
      allowedTools: ['WebSearch', 'WebFetch'],
      maxTurns: 20,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      persistSession: false,
    },
  })

  let searchCount = 0
  for await (const message of queryIterator) {
    if (message.type === 'assistant') {
      // Collect the final text (last assistant message has the JSON)
      let messageText = ''
      for (const block of message.message.content) {
        if ('text' in block) {
          messageText += (block as { text: string }).text
        }
        // Track tool usage for progress updates
        if ('type' in block && block.type === 'tool_use') {
          const toolBlock = block as { name: string; input: Record<string, unknown> }
          if (toolBlock.name === 'WebSearch') {
            searchCount++
            const searchQuery = toolBlock.input?.query as string || 'contenido TikTok'
            onProgress(`Búsqueda ${searchCount}: "${searchQuery}"`, 'searching')
          } else if (toolBlock.name === 'WebFetch') {
            onProgress('Analizando página encontrada...', 'analyzing')
          }
        }
      }
      // Keep the last text block as the response (the final JSON)
      if (messageText.trim()) {
        responseText = messageText
      }
    }
  }

  onProgress(`${searchCount} búsquedas completadas. Procesando resultados...`, 'processing')

  // Parse the JSON response
  return parseFindings(responseText)
}

function parseFindings(text: string): ScoutFindingData[] {
  const validTypes: FindingType[] = ['video', 'comment', 'trend', 'creator']
  const validRelevance: Relevance[] = ['high', 'medium', 'low']
  const validCategories: FindingCategory[] = [
    'pain_point', 'desire', 'objection', 'language', 'trend', 'content_idea',
  ]

  try {
    // Find JSON block containing findings
    const jsonMatch = text.match(/\{[\s\S]*"findings"[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Scout agent: No JSON with findings found')
      throw new Error('No se encontraron hallazgos en la respuesta')
    }

    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.findings || !Array.isArray(parsed.findings)) {
      throw new Error('Formato de hallazgos inválido')
    }

    return parsed.findings
      .filter((f: Record<string, unknown>) => f.content && f.type)
      .map((f: Record<string, unknown>): ScoutFindingData => ({
        type: validTypes.includes(f.type as FindingType) ? f.type as FindingType : 'video',
        content: String(f.content),
        sourceUrl: f.sourceUrl ? String(f.sourceUrl) : undefined,
        creator: f.creator ? String(f.creator) : undefined,
        engagement: f.engagement && typeof f.engagement === 'object'
          ? f.engagement as ScoutFindingData['engagement']
          : undefined,
        relevance: validRelevance.includes(f.relevance as Relevance)
          ? f.relevance as Relevance
          : 'medium',
        relevanceReason: f.relevanceReason
          ? String(f.relevanceReason)
          : 'Relevante para el perfil del avatar',
        category: validCategories.includes(f.category as FindingCategory)
          ? f.category as FindingCategory
          : 'content_idea',
        thumbnailUrl: f.thumbnailUrl ? String(f.thumbnailUrl) : undefined,
      }))
  } catch (error) {
    console.error('Scout agent parse error:', error)
    throw new Error('Error al procesar los hallazgos del agente')
  }
}
