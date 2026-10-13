import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

const serverDirectory = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(serverDirectory, '.env') })

const app = express()
const port = process.env.PORT || 5000
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(cors({ origin: clientUrl }))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok', message: 'TaskFlow API is healthy.' })
})

app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)

app.use((_request, response) => {
  response.status(404).json({ success: false, message: 'Endpoint not found.' })
})

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ success: false, message: 'Request body must be valid JSON.' })
  }

  console.error('Request failed:', error.message)
  return response.status(500).json({ success: false, message: 'An unexpected error occurred.' })
})

const startServer = async () => {
  try {
    await connectDB()

    const server = app.listen(port, () => {
      console.log(`TaskFlow API listening on port ${port}.`)
    })

    server.on('error', (error) => {
      console.error('Failed to start the HTTP server:', error.message)
      process.exit(1)
    })
  } catch (error) {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  }
}

startServer()
