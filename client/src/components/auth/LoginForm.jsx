import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as authApi from '@/api/auth'
import useAuthStore from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginForm() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const auth = await authApi.login(email, password)
      setAuth({ uid: auth.uid, email }, auth.token)
      const user = await authApi.getMe()
      setAuth(user, auth.token)
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Input label="Password" type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" size="lg" loading={loading} onClick={handleLogin}>Login</Button>
    </div>
  )
}
