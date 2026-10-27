import Button from './Button'

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', loading, onCancel, onConfirm }) {
  if (!open) return null
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="w-full max-w-sm rounded-card border border-line bg-surface p-6"><h2 id="confirm-title" className="text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p><div className="mt-6 flex justify-end gap-2"><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button variant="danger" loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div></div></div>
}
