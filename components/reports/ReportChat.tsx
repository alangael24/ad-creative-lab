"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_QUERIES = [
  "Como va mi hit rate?",
  "Cuales son mis mejores angulos?",
  "Dame un resumen de esta semana",
  "Que formatos me funcionan mejor?",
  "Que tengo pendiente de analizar?",
  "Cuales son mis ultimos aprendizajes?",
  "Cuanto dinero tengo en testeo?",
  "Que patrones ves en mis winners?",
]

export function ReportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendQuery = async (query: string) => {
    if (!query.trim() || isLoading) return

    setError(null)
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el informe')
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.report,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el informe')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendQuery(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendQuery(input)
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Asistente de Reportes</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Preguntame lo que quieras sobre tus anuncios en lenguaje natural.
              Puedo analizar tu rendimiento, identificar patrones y darte recomendaciones.
            </p>

            {/* Suggested Queries */}
            <div className="grid grid-cols-2 gap-2 max-w-lg">
              {SUGGESTED_QUERIES.map((query) => (
                <Button
                  key={query}
                  variant="outline"
                  size="sm"
                  className="text-left justify-start h-auto py-2 px-3"
                  onClick={() => sendQuery(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <CardContent className="p-3">
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="bg-muted">
                  <CardContent className="p-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analizando datos...</span>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          {messages.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={clearChat}
              title="Nueva conversacion"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre tus anuncios... (Enter para enviar)"
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            rows={1}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
