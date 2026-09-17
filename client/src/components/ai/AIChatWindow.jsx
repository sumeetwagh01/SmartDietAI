import { Send } from 'lucide-react'
import { useEffect, useState } from 'react'

import { sendMessage } from '@/api/ai'
import Button from '@/components/ui/Button'

export default function AIChatWindow({ prompt = '', onPromptHandled }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (text = input) => {
    if (!text.trim() || loading) return
    const userMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const response = await sendMessage(text, messages)
      setMessages([...nextMessages, { role: 'assistant', content: response.reply }])
    } catch {
      setMessages([...nextMessages, { role: 'assistant', content: 'I could not respond right now. Please try again.' }])
    } finally {
      setLoading(false)
      onPromptHandled?.()
    }
  }

  useEffect(() => {
    if (prompt) submit(prompt)
  }, [prompt])

  return (
    <div className="flex min-h-[60vh] flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="py-16 text-center text-sm text-gray-400">Ask your AI advisor about today's nutrition.</p>}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${message.role === 'user' ? 'bg-gray-200 text-gray-800' : 'border border-gray-100 bg-white text-gray-700 shadow-sm'}`}>{message.content}</div></div>)}
      </div>
      <div className="flex gap-2 border-t border-gray-100 bg-white p-3"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit() }} placeholder="Ask about your diet" className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-brand-green" /><Button loading={loading} onClick={() => submit()}><Send size={17} />Send</Button></div>
    </div>
  )
}
