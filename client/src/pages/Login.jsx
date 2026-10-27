import { Link } from 'react-router-dom'

import LoginForm from '@/components/auth/LoginForm'
import Card from '@/components/ui/Card'
import ThemeToggle from '@/components/ui/ThemeToggle'

export default function Login() {
  return <main className="relative flex min-h-screen items-center justify-center bg-canvas p-4"><div className="absolute right-5 top-5"><ThemeToggle /></div><Card className="w-full max-w-md p-7 sm:p-9"><Link to="/" className="mb-8 inline-flex items-center gap-2 font-bold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-ink">S</span>SmartDiet AI</Link><h1 className="text-3xl font-bold">Welcome back</h1><p className="mb-7 mt-2 text-sm text-muted">Sign in to continue to SmartDiet AI.</p><LoginForm /><p className="mt-6 text-center text-sm text-muted">New here? <Link to="/register" className="font-semibold text-accent">Create an account</Link></p></Card></main>
}
