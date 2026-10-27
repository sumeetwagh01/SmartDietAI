import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import * as authApi from '@/api/auth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getApiError } from '@/utils/apiError'

export default function RegisterForm() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      await authApi.register(name, email, password)
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to register.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleRegister}>
      <Input label="Name" autoComplete="name" required placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} />
      <Input label="Email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Input label="Password" type="password" minLength={8} autoComplete="new-password" required placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <Button type="submit" className="w-full" size="lg" loading={loading} loadingLabel="Waking up the SmartDiet server…">Create account</Button>
    </form>
  )
}
