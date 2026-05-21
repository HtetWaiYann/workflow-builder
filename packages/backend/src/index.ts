import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GREETING } from '@workflow-builder/shared'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(GREETING)
  console.log(`Backend listening on http://localhost:${PORT}`)
})
