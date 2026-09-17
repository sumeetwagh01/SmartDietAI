export default function Card({ children, className = '' }) {
  return <div className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>{children}</div>
}
