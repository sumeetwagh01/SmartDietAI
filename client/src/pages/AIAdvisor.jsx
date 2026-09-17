import { useState } from 'react'

import AIChatWindow from '@/components/ai/AIChatWindow'
import SuggestedPrompts from '@/components/ai/SuggestedPrompts'

export default function AIAdvisor() {
  const [prompt, setPrompt] = useState('')
  return <div className="flex min-h-[calc(100vh-8rem)] flex-col"><div className="mb-4"><h1 className="text-2xl font-bold">AI Advisor</h1><p className="text-sm text-gray-500">Advice is personalized using your profile and today's food log.</p></div><SuggestedPrompts onPrompt={setPrompt} /><AIChatWindow prompt={prompt} onPromptHandled={() => setPrompt('')} /></div>
}
