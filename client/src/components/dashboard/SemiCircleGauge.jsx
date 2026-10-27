import { motion } from 'framer-motion'

export default function SemiCircleGauge({ eaten = 0, target = 0, estimated = false }) {
  const percentage = target ? Math.min(eaten / target, 1) : 0
  const pathLength = Math.PI * 72
  return <div><div className="relative mx-auto h-32 max-w-xs"><svg viewBox="0 0 180 105" className="h-full w-full overflow-visible"><path d="M 18 90 A 72 72 0 0 1 162 90" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" className="text-surface-2" /><motion.path d="M 18 90 A 72 72 0 0 1 162 90" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeDasharray={pathLength} initial={{ strokeDashoffset: pathLength }} animate={{ strokeDashoffset: pathLength * (1 - percentage) }} className="text-accent" /></svg><div className="absolute inset-x-0 bottom-0 text-center"><p className="text-3xl font-bold">{Math.round(eaten)}</p><p className="text-xs text-muted">Eaten · kcal</p></div></div><div className="mt-1 flex justify-between text-sm"><span><strong>{Math.max(0, Math.round(target - eaten))}</strong><span className="ml-1 text-muted">Remaining</span></span><span><span className="mr-1 text-muted">Target</span><strong>{estimated ? '~' : ''}{Math.round(target)}</strong></span></div></div>
}
