'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircleQuestion, X, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  '¿Por dónde empiezo?',
  '¿Qué es un avatar?',
  '¿Cómo creo mi primer anuncio?',
  '¿Qué es la regla de 10 días?',
]

export function GuideChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: messages.slice(-10), // Last 10 messages for context
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al obtener respuesta')
      }

      const assistantMessage: Message = { role: 'assistant', content: data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
          isOpen
            ? 'bg-muted text-muted-foreground'
            : 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
        }`}
        aria-label={isOpen ? 'Cerrar guía' : 'Abrir guía de ayuda'}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircleQuestion className="h-6 w-6" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-150px)] bg-card border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-to-r from-purple-500/10 to-purple-700/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Guía de Ad Creative Lab</h3>
                <p className="text-xs text-muted-foreground">Pregúntame lo que necesites</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-4">
                  ¡Hola! Soy tu guía para aprender a usar Ad Creative Lab.
                  ¿En qué puedo ayudarte?
                </p>
                <div className="space-y-2">
                  {SUGGESTED_QUESTIONS.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(question)}
                      className="block w-full text-left text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t bg-muted/30">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
