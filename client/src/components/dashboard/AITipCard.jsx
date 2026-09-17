import { Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getSuggestions } from '@/api/ai'
import Card from '@/components/ui/Card'

export default function AITipCard() {
  const [tip, setTip] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSuggestions().then((data) => setTip(data.tip)).catch(() => setTip('Tip unavailable right now.')).finally(() => setLoading(false))
  }, [])

  return (
    <Card className="bg-green-50">
      <div className="mb-3 flex items-center gap-2 text-brand-green"><Sparkles size={20} /><h2 className="font-semibold">AI tip</h2></div>
      {loading ? <div className="space-y-2"><div className="h-3 animate-pulse rounded bg-green-100" /><div className="h-3 w-4/5 animate-pulse rounded bg-green-100" /></div> : <p className="text-sm leading-6 text-gray-700">{tip}</p>}
    </Card>
  )
}
