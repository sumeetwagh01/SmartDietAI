export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block space-y-1.5 text-left">
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <input className={`min-h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-ink outline-none transition placeholder:text-muted/70 disabled:cursor-not-allowed disabled:opacity-60 ${className}`} aria-invalid={Boolean(error)} {...props} />
      {error && <span className="text-sm text-error">{error}</span>}
    </label>
  )
}
