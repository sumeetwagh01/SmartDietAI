import Spinner from './Spinner'

const variants = {
  primary: 'bg-brand-green text-white hover:opacity-90',
  secondary: 'border border-brand-green bg-white text-brand-green hover:bg-green-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
}

const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' }

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, onClick, children, className = '' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}>
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
