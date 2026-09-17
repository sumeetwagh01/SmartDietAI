import { Link } from 'react-router-dom'

import RegisterForm from '@/components/auth/RegisterForm'
import Card from '@/components/ui/Card'

export default function Register() {
  return <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4"><Card className="w-full max-w-md p-7"><h1 className="text-2xl font-bold">Create your account</h1><p className="mb-6 mt-1 text-sm text-gray-500">Start building a diet that fits you.</p><RegisterForm /><p className="mt-5 text-center text-sm text-gray-500">Already registered? <Link to="/login" className="font-semibold text-brand-green">Login</Link></p></Card></main>
}
