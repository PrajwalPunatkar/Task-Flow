export const sendError = (response, status, message) =>
  response.status(status).json({ success: false, message })

export const handleAuthError = (error, response) => {
  if (error.code === 11000) {
    return sendError(response, 409, 'An account with this email already exists.')
  }

  if (error.name === 'ValidationError') {
    return sendError(response, 400, 'Please provide valid name, email, and password values.')
  }

  if (error.name === 'MongoServerError' || error.name === 'MongooseError') {
    return sendError(response, 503, 'Authentication service is temporarily unavailable.')
  }

  console.error('Authentication request failed:', error.message)
  return sendError(response, 500, 'An unexpected error occurred.')
}
