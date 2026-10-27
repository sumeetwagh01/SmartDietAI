export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || String(item)).join(' ')
  if (error?.code === 'ECONNABORTED') return 'The SmartDiet server took too long to respond. Please try again.'
  if (error?.request && !error?.response) return 'Cannot reach the SmartDiet API. Please try again.'
  return fallback
}

export function isValidationError(error) {
  return error?.response?.status === 422
}
