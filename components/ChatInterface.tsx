'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bill } from '@/lib/types'
import { useInterests } from '@/components/InterestsProvider'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTED_QUESTIONS = [
  'What does this bill actually do?',
  'Who would be affected by this bill?',
  'What are the arguments for and against it?',
  'Where is this bill in the legislative process?',
]

export default function ChatInterface({ bill }: { bill: Bill }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { userInterests } = useInterests()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, bill, userInterests }),
      })

      if (!res.ok || !res.body) throw new Error('Chat request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              className="ui-suggest-chip"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'ui-chat-user whitespace-pre-wrap'
                    : 'ui-chat-assistant'
                }`}
              >
                {msg.role === 'assistant' ? (
                  msg.content === '' && isLoading ? (
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce">·</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>·</span>
                      <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>·</span>
                    </span>
                  ) : (
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <p className="font-bold text-base mt-2 mb-1 text-[var(--ui-text)]">{children}</p>
                        ),
                        h2: ({ children }) => (
                          <p className="font-bold mt-2 mb-1 text-[var(--ui-text)]">{children}</p>
                        ),
                        h3: ({ children }) => (
                          <p className="font-semibold mt-1.5 mb-0.5 text-[var(--ui-text)]">{children}</p>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-[var(--ui-text)]">{children}</strong>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-0.5 my-1 text-[var(--ui-text)]">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-0.5 my-1 text-[var(--ui-text)]">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="leading-snug">{children}</li>
                        ),
                        p: ({ children }) => (
                          <p className="mb-1.5 last:mb-0 text-[var(--ui-chat-bot-fg)]">{children}</p>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="ui-md-link">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage(input)
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this bill…"
          disabled={isLoading}
          className="ui-input flex-1 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="ui-btn-primary shrink-0"
        >
          Ask
        </button>
      </form>
    </div>
  )
}
