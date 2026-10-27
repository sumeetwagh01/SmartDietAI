import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'

import useToastStore from '@/store/toastStore'

export default function ToastViewport() {
  const { toasts, dismiss } = useToastStore()
  return <div className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2" aria-live="polite"><AnimatePresence>{toasts.map((toast) => <motion.div key={toast.id} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }} className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink shadow-soft">{toast.tone === 'error' ? <CircleAlert className="text-error" size={19} /> : <CheckCircle2 className="text-fibre" size={19} />}<span className="flex-1">{toast.message}</span><button className="grid min-h-11 min-w-11 place-items-center rounded-full text-muted hover:bg-surface-2" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X size={17} /></button></motion.div>)}</AnimatePresence></div>
}
