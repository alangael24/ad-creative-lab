import { NextRequest, NextResponse } from 'next/server'
import { query } from '@anthropic-ai/claude-agent-sdk'

const PLATFORM_KNOWLEDGE = `
# AD CREATIVE LAB - GUÍA COMPLETA DE LA PLATAFORMA

## ¿QUÉ ES AD CREATIVE LAB?
Es una herramienta para gestionar el ciclo completo de creación y testing de anuncios publicitarios. Te ayuda a:
- Investigar a tu audiencia (avatars)
- Crear anuncios con hipótesis claras
- Testear de forma disciplinada (regla de 10 días)
- Aprender de los resultados (winners/losers)
- Mejorar continuamente

## SECCIONES PRINCIPALES

### 1. RESEARCH (Laboratorio de Empatía) - /research
**Para qué sirve:** Investigar y entender profundamente a tu audiencia.

**Conceptos clave:**
- **Avatar**: Tu cliente ideal descrito en detalle (no solo demografía, sino sus luchas diarias, deseos, objeciones, lenguaje)
- **Sub-Avatar**: Momentos específicos del avatar (ej: "Después del pediatra", "Lunes por la mañana")
- **Research Items**: Quotes textuales que recopilas de Reddit, TikTok, Amazon reviews, etc.
- **Insights**: Documentos libres donde escribes observaciones y la IA te ayuda a extraer elementos accionables

**Cómo empezar:**
1. Ve a /research y crea tu primer Avatar
2. Agrega 3-5 pain points específicos (luchas diarias)
3. Agrega 3-5 desires (lo que quieren lograr)
4. Opcional: agrega research items de fuentes reales

### 2. BOARD (Tablero Kanban) - /board
**Para qué sirve:** Visualizar el pipeline de todos tus anuncios.

**Estados del pipeline:**
- **Idea**: Banco de ideas sin filtrar
- **Development**: Escribiendo guiones, hooks
- **Production**: Creando el anuncio (filmando, editando)
- **Testing**: Activo por 10 días (bloqueado automáticamente)
- **Analysis**: Listo para analizar resultados
- **Completed**: Analizado y archivado

**Cómo usar:**
- Arrastra y suelta ads entre columnas
- Los ads en Testing no se pueden mover (regla de 10 días)

### 3. CREAR ANUNCIO - /ads/new
**Para qué sirve:** Crear un nuevo anuncio con toda la información necesaria.

**Secciones del formulario:**
1. **Nomenclatura**: Concepto, ángulo, awareness, formato
2. **Intención** (OBLIGATORIO): Hipótesis de por qué funcionará + avatar target
3. **Desarrollo**: Hook, script, CTA
4. **Testing**: Presupuesto y deadline

**Ángulos disponibles:**
- Fear (miedo)
- Desire (aspiración)
- Curiosity (intriga)
- Offer (promoción)
- Tutorial (cómo hacer)
- Testimonial (prueba social)

### 4. LIBRARY (Librería) - /library
**Para qué sirve:** Ver todos los anuncios completados y sus learnings.

**Funcionalidades:**
- Filtrar por resultado (winners/losers)
- Filtrar por ángulo, formato, elemento que funcionó
- Ver learnings de cada ad
- Buscar por texto

### 5. VERSUS (Battleground) - /versus
**Para qué sirve:** Comparar winners vs losers lado a lado para identificar patrones.

### 6. COMPETITORS (Swipe File) - /competitors
**Para qué sirve:** Guardar y organizar anuncios de la competencia.

**Cómo usar:**
1. Crea un competidor (marca)
2. Agrega sus anuncios con análisis (hook, ángulo, qué funciona)
3. Usa el "Muro de Creativos" para inspiración visual

### 7. REPORTS (Reportes IA) - /reports
**Para qué sirve:** Hacer preguntas sobre tus datos y obtener análisis automático.

**Ejemplos de preguntas:**
- "¿Cuál es mi hit rate este mes?"
- "¿Qué ángulo tiene mejor rendimiento?"
- "¿Qué patrones ves en mis losers?"

### 8. INSIGHTS - /research/insights
**Para qué sirve:** Documentar observaciones de investigación en formato libre.

**Funcionalidades:**
- Editor tipo Google Docs
- Vincular a avatars
- Botón "Analizar con IA" que extrae:
  - Pain points
  - Desires
  - Objections
  - Language
  - Sugiere avatars existentes o nuevos

## REGLA DE LOS 10 DÍAS
Cuando un ad entra a Testing:
1. Se bloquea automáticamente por 10 días
2. No puedes moverlo durante este tiempo
3. Después de 10 días, se mueve automáticamente a Analysis
4. Recibes una alerta en el dashboard

**¿Por qué?** Para evitar tomar decisiones emocionales y dar tiempo suficiente a los datos.

## MÉTRICAS IMPORTANTES

### Para anuncios de video:
- **Hook Rate** = Vistas 3 segundos / Impresiones
  - < 20% = Hook débil, no engancha
- **Hold Rate** = Vistas completas / Vistas 3 segundos
  - Si es bajo = Guión aburrido después del hook
- **ROAS** = Revenue / Spend
  - > 3 = Bueno
  - < 1 = Perdiendo dinero

## FLUJO RECOMENDADO PARA PRINCIPIANTES

### Semana 1: Investigación
1. Crea 1-2 avatars con pain points y desires
2. Recopila 10-20 research items de fuentes reales
3. Documenta observaciones en Insights

### Semana 2: Primeros Anuncios
1. Crea 3-5 ads con hipótesis claras
2. Conecta cada ad con un avatar
3. Escribe hook y script basado en el research

### Semana 3-4: Testing
1. Mueve ads a Testing
2. Espera los 10 días (no toques nada)
3. Ingresa métricas cuando terminen

### Semana 5+: Aprendizaje
1. Haz post-mortem de cada ad
2. Marca winners/losers
3. Guarda learnings
4. Usa la librería para identificar patrones
5. Crea nuevos ads basados en lo aprendido

## TIPS IMPORTANTES

1. **Siempre escribe una hipótesis**: "Creo que funcionará porque..." te obliga a pensar antes de crear.

2. **Sé específico con los pain points**: "Quiere bajar de peso" es genérico. "Quiere poder jugar con sus hijos sin cansarse a los 5 minutos" es específico.

3. **Usa lenguaje real**: Copia frases exactas de tu research, no inventes.

4. **No abandones el testing temprano**: La regla de 10 días existe por una razón.

5. **Analiza tanto winners como losers**: Los losers enseñan más.

6. **Evalúa por elementos**: No solo si el ad ganó, sino QUÉ elemento funcionó (hook, script, visual, etc.)
`

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 })
    }

    const systemPrompt = `Eres el asistente de ayuda de Ad Creative Lab, una plataforma para crear y testear anuncios publicitarios.

Tu rol es ayudar a usuarios principiantes a entender cómo funciona la plataforma y guiarlos paso a paso.

CONOCIMIENTO DE LA PLATAFORMA:
${PLATFORM_KNOWLEDGE}

INSTRUCCIONES:
- Responde siempre en español
- Sé amigable, paciente y claro
- Usa ejemplos concretos cuando sea posible
- Si el usuario pregunta algo que no está en tu conocimiento, dilo honestamente
- Guía paso a paso cuando sea apropiado
- Usa emojis con moderación para ser más amigable
- Si el usuario parece perdido, sugiere por dónde empezar
- Mantén las respuestas concisas pero completas
- Usa formato markdown para mejor legibilidad (listas, negritas, etc.)

CONTEXTO DE LA CONVERSACIÓN:
${history?.length > 0 ? history.map((h: {role: string, content: string}) => `${h.role}: ${h.content}`).join('\n') : 'Nueva conversación'}`

    let responseText = ''

    const queryIterator = query({
      prompt: `${systemPrompt}\n\nUsuario: ${message}`,
      options: {
        tools: [],
        allowedTools: [],
      },
    })

    for await (const msg of queryIterator) {
      if (msg.type === 'assistant') {
        for (const block of msg.message.content) {
          if ('text' in block) {
            responseText += block.text
          }
        }
      }
    }

    if (!responseText) {
      responseText = 'Lo siento, no pude procesar tu pregunta. ¿Podrías intentar de nuevo?'
    }

    return NextResponse.json({ response: responseText })
  } catch (error) {
    console.error('Error in guide chat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la pregunta' },
      { status: 500 }
    )
  }
}
