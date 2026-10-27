export default function Card({ children, className = '' }) {
  return <div className={`rounded-card border border-line bg-surface p-5 ${className}`}>{children}</div>
}
