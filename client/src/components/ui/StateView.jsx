import { RefreshCw } from 'lucide-react'

import Button from './Button'
import Card from './Card'

export function PageSkeleton() {
  return <div className="space-y-5" aria-label="Loading"><p className="text-sm text-muted">Waking up the SmartDiet server…</p><div className="skeleton h-9 w-52" /><div className="grid gap-4 md:grid-cols-3"><div className="skeleton h-56" /><div className="skeleton h-56" /><div className="skeleton h-56" /></div><div className="skeleton h-64" /></div>
}

export function ErrorState({ message, onRetry }) {
  return <Card className="flex min-h-52 flex-col items-center justify-center text-center"><p className="max-w-md text-error">{message}</p>{onRetry && <Button variant="secondary" className="mt-5" onClick={onRetry}><RefreshCw size={17} />Try again</Button>}</Card>
}

export function EmptyState({ title, description, action }) {
  return <Card className="flex min-h-52 flex-col items-center justify-center text-center"><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 max-w-md text-sm text-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</Card>
}
