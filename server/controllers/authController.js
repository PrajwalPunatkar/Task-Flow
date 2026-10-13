import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { handleAuthError, sendError } from '../utils/authErrors.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const passwordMinLength = 8
const passwordRounds = 12

const safeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const normalizeEmail = (email) => email.trim().toLowerCase()

export const register = async (request, response) => {
  const { name, email, password } = request.body ?? {}

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 100 ||
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    email.trim().length > 254 ||
    typeof password !== 'string' ||
    password.length < passwordMinLength ||
    !passwordPattern.test(password)
  ) {
    return sendError(
      response,
      400,
      'Provide a name, valid email, and password of at least 8 characters with uppercase, lowercase, and numeric characters.',
    )
  }

  const normalizedEmail = normalizeEmail(email)

  try {
    const existingUser = await User.findOne({ email: normalizedEmail }).select('_id')
    if (existingUser) {
      return sendError(response, 409, 'An account with this email already exists.')
    }

    const hashedPassword = await bcrypt.hash(password, passwordRounds)
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword })

    return response.status(201).json({ success: true, user: safeUser(user) })
  } catch (error) {
    return handleAuthError(error, response)
  }
}

export const login = async (request, response) => {
  const { email, password } = request.body ?? {}

  if (
    typeof email !== 'string' ||
    !emailPattern.test(email.trim()) ||
    typeof password !== 'string' ||
    !password
  ) {
    return sendError(response, 400, 'Provide a valid email and password.')
  }

  try {
    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password')
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false

    if (!user || !passwordMatches) {
      return sendError(response, 401, 'Invalid email or password.')
    }

    const { JWT_SECRET, JWT_EXPIRES_IN } = process.env
    if (!JWT_SECRET || !JWT_EXPIRES_IN) {
      console.error('JWT_SECRET and JWT_EXPIRES_IN must be configured.')
      return sendError(response, 503, 'Authentication service is not configured.')
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })

    return response.status(200).json({ success: true, token, user: safeUser(user) })
  } catch (error) {
    return handleAuthError(error, response)
  }
}
