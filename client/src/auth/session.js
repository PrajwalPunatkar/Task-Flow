const SESSION_KEY = 'taskflow.session'

export const getStoredSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    if (!session) return null
    if (!session.token || !session.user?.id || !session.user?.email) {
      clearStoredSession()
      return null
    }

    const payloadSegment = session.token.split('.')[1]
    if (!payloadSegment) {
      clearStoredSession()
      return null
    }
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/')
    const tokenPayload = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    if (typeof tokenPayload.exp !== 'number' || tokenPayload.exp * 1000 <= Date.now()) {
      clearStoredSession()
      return null
    }

    return { token: session.token, user: session.user }
  } catch {
    clearStoredSession()
    return null
  }
}

export const getStoredToken = () => getStoredSession()?.token ?? null

export const saveSession = (token, user) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }))
}

export const clearStoredSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // Storage may be unavailable in restricted browser contexts.
  }
}
