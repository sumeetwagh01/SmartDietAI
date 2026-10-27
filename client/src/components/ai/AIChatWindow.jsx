import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Copy, RefreshCw, Send, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { sendMessage } from '@/api/ai'
import Button from '@/components/ui/Button'
import useToastStore from '@/store/toastStore'
import { getApiError } from '@/utils/apiError'

const historyFrom = (messages) => messages.filter((message) => !message.failed && ['user', 'assistant'].includes(message.role)).map(({ role, content }) => ({ role, content }))

const markdownComponents = {
  h1: ({ children }) => <h1 className="mb-2 mt-4 text-lg font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-3 font-semibold first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="mb-3 whitespace-pre-wrap last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-accent pl-3 text-muted">{children}</blockquote>,
  pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-xl bg-canvas p-3 text-xs leading-5">{children}</pre>,
  code: ({ children }) => <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[0.82em]">{children}</code>,
  a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-accent underline underline-offset-2">{children}</a>,
  hr: () => <hr className="my-4 border-line" />,
  table: ({ children }) => <table className="my-3 block max-w-full overflow-x-auto text-left text-xs">{children}</table>,
  th: ({ children }) => <th className="border border-line bg-surface px-2 py-1.5 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-line px-2 py-1.5 align-top">{children}</td>,
}

export default function AIChatWindow({ prompt = '', onPromptHandled, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const handledPrompt = useRef('')
  const reduced = useReducedMotion()
  const showToast = useToastStore((state) => state.show)

  const submit = useCallback(async (text, retryIndex = null) => {
    const submitted = String(text ?? input).trim()
    if (!submitted || loading) return
    const base = retryIndex == null ? messages : messages.slice(0, retryIndex)
    const userMessage = { id: `${Date.now()}-user`, role: 'user', content: submitted, failed: false }
    const pending = [...base, userMessage]
    setMessages(pending); setInput(''); setLoading(true)
    try {
      const response = await sendMessage(submitted, historyFrom(base))
      setMessages([...pending, { id: `${Date.now()}-assistant`, role: 'assistant', content: response.reply }])
    } catch (error) {
      setMessages([...base, { ...userMessage, failed: true, error: getApiError(error, 'NutriBites could not respond. Please try again.') }])
    } finally { setLoading(false); onPromptHandled?.() }
  }, [input, loading, messages, onPromptHandled])

  useEffect(() => {
    if (prompt && handledPrompt.current !== prompt) { handledPrompt.current = prompt; submit(prompt) }
    if (!prompt) handledPrompt.current = ''
  }, [prompt, submit])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }) }, [messages, loading, reduced])
  const copy = async (content) => { try { await navigator.clipboard.writeText(content); showToast('Message copied.') } catch { showToast('Unable to copy message.', 'error') } }
  const onKeyDown = (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }

  return <motion.section initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] flex flex-col bg-canvas" aria-label="NutriBites chat">
    <header className="border-b border-line bg-surface px-4 py-3"><div className="mx-auto flex max-w-[900px] items-center gap-3"><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-full bg-surface-2" aria-label="Close chat"><ArrowLeft size={19} /></button><span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-ink"><Sparkles size={20} /></span><div><h1 className="font-bold">NutriBites</h1><p className="text-xs text-muted">Your practical nutrition companion</p></div></div></header>
    <div className="mx-auto flex min-h-0 w-full max-w-[900px] flex-1 flex-col"><div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">{!messages.length ? <div className="flex min-h-full flex-col items-center justify-center text-center"><span className="grid h-16 w-16 place-items-center rounded-3xl bg-accent/10 text-accent"><Sparkles size={27} /></span><h2 className="mt-5 text-xl font-bold">What’s on your plate?</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted">Ask about meals, nutrition, or how today’s choices fit your goal.</p></div> : null}{messages.map((message, index) => <div key={message.id} className={`group flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className="max-w-[88%] sm:max-w-[75%]"><div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? message.failed ? 'border border-error/40 bg-error/10 text-ink' : 'bg-accent text-accent-ink' : 'bg-surface-2 text-ink'}`}>{message.role === 'assistant' ? <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown> : <span className="whitespace-pre-wrap">{message.content}</span>}</div><div className={`mt-1 flex items-center gap-1 ${message.role === 'user' ? 'justify-end' : ''}`}><button type="button" onClick={() => copy(message.content)} className="grid min-h-11 min-w-11 place-items-center rounded-full text-muted hover:bg-surface" aria-label="Copy message"><Copy size={14} /></button>{message.failed ? <><span className="text-xs text-error">{message.error}</span><button type="button" disabled={loading} onClick={() => submit(message.content, index)} className="flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-semibold text-error hover:bg-error/10"><RefreshCw size={14} />Retry</button></> : null}</div></div></div>)}{loading ? <div className="flex items-center gap-2" aria-label="NutriBites is typing"><div className="flex gap-1 rounded-2xl bg-surface-2 p-4"><span className="h-2 w-2 animate-bounce rounded-full bg-muted" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:120ms]" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted [animation-delay:240ms]" /></div><span className="text-xs text-muted">Waking up the SmartDiet server…</span></div> : null}<div ref={bottomRef} /></div>
      <div className="border-t border-line bg-surface p-3 sm:p-4"><p className="mb-3 rounded-xl bg-carbs/10 px-3 py-2 text-center text-xs text-carbs">NutriBites is not a doctor and doesn&apos;t replace professional medical care.</p><form onSubmit={(event) => { event.preventDefault(); submit() }}><div className="flex items-end gap-2"><label className="sr-only" htmlFor="ai-message">Message NutriBites</label><textarea id="ai-message" rows="1" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={onKeyDown} placeholder="Ask NutriBites…" className="max-h-36 min-h-12 min-w-0 flex-1 resize-y rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink outline-none placeholder:text-muted" /><Button type="submit" disabled={!input.trim() || loading} loading={loading} aria-label="Send message"><Send size={18} /><span className="hidden sm:inline">Send</span></Button></div><p className="mt-2 px-2 text-xs text-muted">Enter to send · Shift+Enter for a new line</p></form></div>
    </div>
  </motion.section>
}
