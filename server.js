const WebSocket = require('ws')
const http = require('http')
const express = require('express')
const cors = require('cors')
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server: server })
const allowedOrigins = ['http://localhost:5173'];
// Enable CORS

app.use(cors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type",
    credentials: true
  }));

  

server.on('upgrade', (request, socket, head) => {
    console.log('WebSocket connection upgrade')
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request)
    })
  })

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    console.log('WebSocket connection established')
  setupWSConnection(ws, req)
})

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 8080

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// Handle server shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})