import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

import { getMe } from '@/api/auth'
import useAuthStore from '@/store/authStore'
import useOnboardingStore from '@/store/onboardingStore'
import { getApiError } from '@/utils/apiError'
import { firstIncompleteStep, profileDraft, profileIsComplete } from '@/utils/profile'

export default function ProtectedRoute({ children, allowIncomplete = false }) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const [status, setStatus] = useState(token ? 'checking' : 'idle')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!token) return undefined
    let active = true
    getMe()
      .then((profile) => {
        if (!active) return
        setAuth(profile, token)
        if (!allowIncomplete && !profileIsComplete(profile)) {
          useOnboardingStore.getState().setDraft(profileDraft(profile))
          useOnboardingStore.getState().setStep(firstIncompleteStep(profile))
        }
        setStatus('ready')
      })
      .catch((requestError) => {
        if (!active) return
        setError(getApiError(requestError, 'Unable to verify your saved profile.'))
        setStatus('error')
      })
    return () => { active = false }
  }, [allowIncomplete, attempt, setAuth, token])

  if (!token) return <Navigate to="/login" replace />
  if (status === 'checking' || status === 'idle') return <div className="grid min-h-[55vh] place-items-center"><div className="text-center"><div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-accent" /><p className="mt-4 text-sm text-muted">Checking your saved profile…</p></div></div>
  if (status === 'error') return <div className="grid min-h-[55vh] place-items-center px-4 text-center"><div><p className="text-error" role="alert">{error}</p><button type="button" onClick={() => { setStatus('checking'); setError(''); setAttempt((value) => value + 1) }} className="mt-4 min-h-11 rounded-full border border-line px-5 font-semibold">Try again</button></div></div>
  if (!allowIncomplete && !profileIsComplete(user)) return <Navigate to="/onboarding" replace state={{ reason: 'profile-incomplete' }} />
  return children
}
