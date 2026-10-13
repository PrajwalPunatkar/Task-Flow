import { sendError } from './authErrors.js'

export const handleTaskError = (error, response) => {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return sendError(response, 400, 'Task data is invalid.')
  }

  if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
    return sendError(response, 503, 'Task service is temporarily unavailable.')
  }

  console.error('Task request failed:', error.message)
  return sendError(response, 500, 'An unexpected error occurred.')
}
