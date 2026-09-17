import { Link } from 'react-router-dom'

import LoginForm from '@/components/auth/LoginForm'
import Card from '@/components/ui/Card'

export default function Login() {
  return <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4"><Card className="w-full max-w-md p-7"><h1 className="text-2xl font-bold">Welcome back</h1><p className="mb-6 mt-1 text-sm text-gray-500">Sign in to continue to SmartDiet AI.</p><LoginForm /><p className="mt-5 text-center text-sm text-gray-500">New here? <Link to="/register" className="font-semibold text-brand-green">Create an account</Link></p></Card></main>
}
