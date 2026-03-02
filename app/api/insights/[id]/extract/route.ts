import { NextRequest, NextResponse } from 'next/server'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [insight, existingAvatars] = await Promise.all([
      prisma.insight.findUnique({
        where: { id },
      }),
      prisma.avatar.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          painPoints: true,
          desires: true,
          ageRange: true,
          gender: true,
        },
      }),
    ])

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
    }

    // Parse the Tiptap JSON content to plain text
    const plainText = extractPlainText(insight.content)

    if (!plainText.trim()) {
      return NextResponse.json({ error: 'El insight está vacío' }, { status: 400 })
    }

    // Format existing avatars for the prompt
    const avatarsContext = existingAvatars.length > 0
      ? `\n\nAVATARS EXISTENTES EN EL SISTEMA:
${existingAvatars.map(a => `- ID: "${a.id}" | Nombre: "${a.name}" | ${a.description || 'Sin descripción'} | Pain points: ${a.painPoints} | Deseos: ${a.desires}`).join('\n')}`
      : '\n\nNo hay avatars existentes en el sistema.'

    const systemPrompt = `Eres un experto en investigación de mercado y psicología del consumidor para publicidad.

Tu tarea es analizar notas de investigación y extraer elementos accionables para crear anuncios efectivos.

Para cada observación que encuentres, extrae:

1. **Pain Points**: Dolores, frustraciones, miedos específicos. Escríbelos en primera persona como si fuera el avatar hablando.
   Ejemplo: "No me reconozco cuando me veo en el espejo después del embarazo"

2. **Desires**: Deseos, aspiraciones, lo que quieren lograr. También en primera persona.
   Ejemplo: "Quiero volver a sentirme cómoda en mi propio cuerpo"

3. **Objections**: Objeciones o resistencias que podrían tener ante una solución.
   Ejemplo: "Ya probé de todo y nada funciona"

4. **Language**: Frases textuales o expresiones que usaría este tipo de persona.
   Ejemplo: "cuerpo de mamá", "recuperar mi figura"

5. **Suggested Angles**: Para cada insight, sugiere qué tipo de ángulo publicitario funcionaría mejor:
   - fear: Apelar al miedo de que algo malo pase o siga pasando
   - desire: Mostrar el resultado deseado, la transformación
   - curiosity: Generar intriga, "el secreto que nadie te cuenta"
   - social_proof: Testimonios, "miles de mujeres ya lo lograron"
   - urgency: Crear urgencia, "antes de que sea tarde"

6. **Avatar Matching**: Analiza si las observaciones corresponden a algún avatar existente o si se debería crear uno nuevo.
   - Si coincide con un avatar existente, indica su ID
   - Si debería ser un avatar nuevo, sugiere un nombre descriptivo

IMPORTANTE:
- Sé específico, no genérico. "Quiero bajar de peso" es genérico. "Quiero poder jugar con mis hijos sin cansarme a los 5 minutos" es específico.
- Escribe en español
- Usa el lenguaje real que usaría la persona, no lenguaje de marketing
- Si una observación puede interpretarse de varias formas, incluye las variantes
${avatarsContext}

Responde SOLO con JSON válido en este formato exacto:
{
  "extractions": [
    {
      "original_text": "El fragmento original del texto que analizaste",
      "pain_points": ["dolor 1 en primera persona", "dolor 2"],
      "desires": ["deseo 1 en primera persona"],
      "objections": ["objeción 1"],
      "language": ["frase o expresión"],
      "suggested_angles": ["fear", "desire"],
      "avatar_match": {
        "type": "existing" | "new",
        "existing_avatar_id": "id del avatar si es existing, null si es new",
        "existing_avatar_name": "nombre del avatar existente si aplica",
        "suggested_avatar_name": "nombre sugerido si es new, null si es existing",
        "confidence": "high" | "medium" | "low",
        "reason": "Por qué coincide o por qué debería ser nuevo"
      }
    }
  ]
}`

    const userPrompt = `Analiza estas notas de investigación y extrae elementos accionables:

${plainText}`

    let responseText = ''

    const queryIterator = query({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      options: {
        tools: [],
        allowedTools: [],
      },
    })

    for await (const message of queryIterator) {
      if (message.type === 'assistant') {
        for (const block of message.message.content) {
          if ('text' in block) {
            responseText += block.text
          }
        }
      }
    }

    // Parse the JSON response
    try {
      // Find JSON in the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      const parsed = JSON.parse(jsonMatch[0])
      return NextResponse.json(parsed)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('Raw response:', responseText)
      return NextResponse.json(
        { error: 'Error al procesar la respuesta de IA', raw: responseText },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error extracting insights:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al extraer insights' },
      { status: 500 }
    )
  }
}

function extractPlainText(content: string): string {
  if (!content) return ''

  try {
    const parsed = JSON.parse(content)
    return extractTextFromNode(parsed)
  } catch {
    return content
  }
}

function extractTextFromNode(node: unknown): string {
  if (typeof node === 'string') return node

  if (node && typeof node === 'object') {
    const n = node as { text?: string; content?: unknown[] }
    if (n.text) return n.text
    if (n.content && Array.isArray(n.content)) {
      return n.content.map(extractTextFromNode).join('\n')
    }
  }

  return ''
}
