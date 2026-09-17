export default function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block space-y-1.5 text-left">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <input className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-brand-green focus:ring-2 focus:ring-green-100 ${className}`} {...props} />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  )
}
