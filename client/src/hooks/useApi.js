import { useCallback, useEffect, useRef, useState } from 'react'

import { getApiError } from '@/utils/apiError'

export default function useApi(request, { immediate = true, initialData = null, errorMessage } = {}) {
  const requestRef = useRef(request)
  const [data, setData] = useState(initialData)
  const [status, setStatus] = useState(immediate ? 'loading' : 'idle')
  const [error, setError] = useState('')

  useEffect(() => { requestRef.current = request }, [request])

  const execute = useCallback(async (...args) => {
    setStatus('loading')
    setError('')
    try {
      const result = await requestRef.current(...args)
      setData(result)
      setStatus(result == null || (Array.isArray(result) && !result.length) ? 'empty' : 'success')
      return result
    } catch (requestError) {
      setError(getApiError(requestError, errorMessage))
      setStatus('error')
      throw requestError
    }
  }, [errorMessage])

  useEffect(() => {
    if (immediate) Promise.resolve().then(() => execute().catch(() => {}))
  }, [execute, immediate])

  return { data, setData, status, loading: status === 'loading', error, setError, execute, retry: execute }
}
