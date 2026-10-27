import Spinner from './Spinner'

const variants = {
  primary: 'bg-accent text-accent-ink hover:brightness-95',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'bg-transparent text-muted hover:bg-surface-2 hover:text-ink',
  danger: 'bg-error/15 text-error hover:bg-error/25',
}

const sizes = { sm: 'min-h-11 px-4 py-2 text-sm', md: 'min-h-11 px-5 py-2.5 text-sm', lg: 'min-h-12 px-6 py-3 text-base' }

export default function Button({ variant = 'primary', size = 'md', loading = false, loadingLabel, disabled = false, onClick, children, className = '', type = 'button', ...props }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} aria-busy={loading} className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading && <Spinner size="sm" />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  )
}
