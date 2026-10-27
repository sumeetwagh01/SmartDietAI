import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update) }
  }, [])
  return online ? null : <div role="status" className="fixed inset-x-0 top-0 z-[100] flex min-h-11 items-center justify-center gap-2 bg-error px-4 py-2 text-center text-sm font-semibold text-white"><WifiOff size={17} />You’re offline. Saved device data is still available; server features will resume when you reconnect.</div>
}
