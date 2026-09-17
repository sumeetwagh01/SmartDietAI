import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as authApi from '@/api/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import useAuthStore from '@/store/authStore'

export default function RegisterForm() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setError('')
    setLoading(true)
    try {
      await authApi.register(name, email, password)
      const auth = await authApi.login(email, password)
      setAuth({ uid: auth.uid, name, email }, auth.token)
      navigate('/onboarding')
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to register.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Name" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
      <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Input label="Password" type="password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button className="w-full" size="lg" loading={loading} onClick={handleRegister}>Create account</Button>
    </div>
  )
}
