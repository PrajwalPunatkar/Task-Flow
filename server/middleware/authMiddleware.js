import jwt from 'jsonwebtoken'
import { sendError } from '../utils/authErrors.js'

const authenticate = (request, response, next) => {
  const authorization = request.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return sendError(response, 401, 'Authentication is required.')
  }

  const { JWT_SECRET } = process.env
  if (!JWT_SECRET) {
    console.error('JWT_SECRET must be configured.')
    return sendError(response, 503, 'Authentication service is not configured.')
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (typeof payload !== 'object' || typeof payload.userId !== 'string') {
      return sendError(response, 401, 'Invalid or expired authentication token.')
    }

    request.userId = payload.userId
    return next()
  } catch {
    return sendError(response, 401, 'Invalid or expired authentication token.')
  }
}

export default authenticate
