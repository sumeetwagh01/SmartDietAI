import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import * as authApi from '@/api/auth'
import useAuthStore from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getApiError } from '@/utils/apiError'
import { clearPerUserClientData } from '@/utils/session'

const profileIsComplete = (user) => Boolean(user?.age && user?.gender && user?.weight_kg && user?.height_cm && user?.activity_level && user?.goal)

export default function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const auth = await authApi.login(email, password)
      const previousUid = useAuthStore.getState().lastUserUid
      if (previousUid && previousUid !== auth.uid) clearPerUserClientData()
      setAuth({ uid: auth.uid, email }, auth.token)
      const user = await authApi.getMe()
      setAuth(user, auth.token)
      navigate(profileIsComplete(user) ? '/dashboard' : '/onboarding', { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to sign in.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      {location.state?.registered && <p className="rounded-2xl bg-fibre/10 px-4 py-3 text-sm text-fibre">Account created. Sign in to continue.</p>}
      {searchParams.get('reason') === 'session-expired' && <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">Your session expired. Please sign in again.</p>}
      <Input label="Email" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
      <Input label="Password" type="password" autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <Button type="submit" className="w-full" size="lg" loading={loading} loadingLabel="Waking up the SmartDiet server…">Login</Button>
    </form>
  )
}
