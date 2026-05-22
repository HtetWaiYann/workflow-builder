import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { logger } from './lib/logger'
import { checkDbConnection } from './db/client'
import authRouter from './routes/auth'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/auth', authRouter)

async function start() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
  const missing = requiredEnvVars.filter((key) => !process.env[key])
  if (missing.length > 0) {
    logger.fatal({ missing }, 'Missing required environment variables')
    process.exit(1)
  }

  try {
    await checkDbConnection()
    logger.info('Database connection OK')
  } catch (err) {
    logger.fatal({ err }, 'Failed to connect to database')
    process.exit(1)
  }

  app.listen(PORT, () => {
    logger.info(`Backend listening on http://localhost:${PORT}`)
  })
}

start()
