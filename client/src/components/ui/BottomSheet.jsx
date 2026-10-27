import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export default function BottomSheet({ open, title, onClose, children }) {
  const panelRef = useRef(null)
  const previousFocus = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    previousFocus.current = document.activeElement
    const panel = panelRef.current
    const focusable = () => [...(panel?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]') || [])]
    focusable()[0]?.focus()
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]; const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); previousFocus.current?.focus?.() }
  }, [onClose, open])
  return <AnimatePresence>{open ? <><motion.button type="button" aria-label="Close sheet" className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} /><motion.section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="sheet-title" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 320 }} className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[32px] border border-line bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-soft sm:left-1/2 sm:max-w-xl sm:-translate-x-1/2"><div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted/30" /><div className="mb-5 flex items-center justify-between"><h2 id="sheet-title" className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-full bg-surface-2 text-muted" aria-label="Close"><X size={19} /></button></div>{children}</motion.section></> : null}</AnimatePresence>
}
