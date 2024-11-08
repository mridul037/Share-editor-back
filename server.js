const WebSocket = require('ws')
const http = require('http')
const express = require('express')
const cors = require('cors')
const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils')

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server,
    path: '/my-shared-doc'})
const allowedOrigins = ['https://idyllic-kitsune-c7f4b8.netlify.app/'];
// Enable CORS

app.use(cors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type",
    credentials: true
  }));

  

  server.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin;
    
    // Verify origin
    if (!allowedOrigins.includes(origin) && process.env.NODE_ENV !== 'development') {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
  
    // Handle upgrade
    wss.handleUpgrade(request, socket, head, (ws) => {
      console.log('WebSocket connection established from:', origin);
      wss.emit('connection', ws, request);
    });
  });

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    try {
      setupWSConnection(ws, req);
      
      // Send connection confirmation
      ws.send(JSON.stringify({ 
        type: 'connection', 
        status: 'connected',
        timestamp: new Date().toISOString()
      }));
  
    } catch (error) {
      console.error('Error in connection handler:', error);
      ws.close();
    }
    ws.on('close', () => {
        console.log('Client disconnected');
      });
    
      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

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
    wss.clients.forEach(client => {
        client.close();
      });
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})