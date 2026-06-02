import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { logger } from './lib/logger'
import { checkDbConnection } from './db/client'
import authRouter from './routes/auth'
import workflowRouter from './routes/workflows'
import { executionDetailRouter } from './routes/executions'
import { webhooksRouter } from './routes/webhooks'
import { variablesRouter } from './routes/variables'
import { workspacesRouter } from './routes/workspaces'
import { startCronWorker } from './queues/cronWorker'

const app = express()
const PORT = process.env.PORT || 3001
const CORS_ORIGIN = process.env.CORS_ORIGIN

// Trust the nginx reverse proxy so req.ip reflects the real client IP,
// which express-rate-limit uses for per-IP bucketing.
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// ── Rate limiters ─────────────────────────────────────────────────────────────

const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 2000000, // just for testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
})

const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
})

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Public — no auth middleware
app.use('/webhooks', webhookLimiter, webhooksRouter)

app.use('/auth', authLimiter, authRouter)
app.use('/workspaces', apiLimiter, workspacesRouter)
app.use('/workflows', apiLimiter, workflowRouter)
app.use('/executions', apiLimiter, executionDetailRouter)
app.use('/workspace/variables', apiLimiter, variablesRouter)

/** Validates required env vars, opens the DB connection, then starts the HTTP server. */
async function start() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CORS_ORIGIN',
    'ENCRYPTION_KEY',
  ]
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

  const server = app.listen(PORT, () => {
    logger.info(`Backend listening on http://localhost:${PORT}`)
  })

  // Start BullMQ cron worker only when Redis is configured
  let cronWorker: ReturnType<typeof startCronWorker> | null = null
  if (process.env.REDIS_URL) {
    cronWorker = startCronWorker()
    logger.info('Cron worker started')
  } else {
    logger.warn('REDIS_URL not set — cron triggers are disabled')
  }

  const shutdown = async () => {
    logger.info('Shutting down...')
    server.close()
    if (cronWorker) await cronWorker.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

start()
