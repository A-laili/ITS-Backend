const WebSocket = require('ws');
const eventBroker = require('./eventBroker');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map();
        console.log('[WebSocket] Service instance created');
    }

    initialize(server) {
        if (this.wss) {
            console.log('[WebSocket] Server already initialized');
            return;
        }

        console.log('[WebSocket] Initializing WebSocket server...');

        // Create WebSocket server
        this.wss = new WebSocket.Server({
            server,
            path: '/ws',
            clientTracking: true,
            handleProtocols: (protocols) => protocols?.[0] || ''
        });

        // Setup event broker subscription FIRST
        console.log('[WebSocket] Setting up event broker subscription...');
        eventBroker.subscribe('newEvent', (eventData) => {
            console.log('[WebSocket] Received newEvent:', eventData.type);
            this.broadcast(eventData);
        });

        // Verify subscription
        eventBroker.listSubscriptions();

        // Setup connection handlers
        this._setupConnectionHandlers();

        console.log('[WebSocket] Server initialized successfully');
    }

    _setupConnectionHandlers() {
        // Check connections every 30 seconds
        const connectionCheckInterval = setInterval(() => {
            this.clients.forEach((ws, clientId) => {
                if (ws.isAlive === false) {
                    console.log(`[WebSocket] Terminating inactive client: ${clientId}`);
                    ws.terminate();
                    this.clients.delete(clientId);
                    return;
                }
                
                ws.isAlive = false;
                ws.ping((err) => {
                    if (err) {
                        console.error(`[WebSocket] Ping failed for ${clientId}:`, err);
                        ws.terminate();
                        this.clients.delete(clientId);
                    }
                });
            });

            console.log(`[WebSocket] Active connections: ${this.clients.size}`);
        }, 30000);

        // Handle new connections
        this.wss.on('connection', this._handleNewConnection.bind(this));

        // Cleanup on server close
        this.wss.on('close', () => {
            clearInterval(connectionCheckInterval);
            this.clients.forEach((ws) => ws.terminate());
            this.clients.clear();
        });
    }

    _handleNewConnection(ws, req) {
        const clientId = `${req.socket.remoteAddress}:${req.socket.remotePort}`;
        
        // Set initial connection state
        ws.isAlive = true;
        ws.clientId = clientId;
        ws.lastActivity = Date.now();

        // Handle existing connection
        if (this.clients.has(clientId)) {
            const existingClient = this.clients.get(clientId);
            console.log(`[WebSocket] Closing existing connection for ${clientId}`);
            existingClient.terminate();
            this.clients.delete(clientId);
        }

        this.clients.set(clientId, ws);
        console.log(`[WebSocket] New connection from ${clientId}`);

        // Send connection confirmation
        this._sendToClient(ws, {
            type: 'CONNECTION_STATUS',
            data: { 
                status: 'connected', 
                clientId,
                timestamp: new Date().toISOString()
            }
        });

        // Handle pong responses
        ws.on('pong', () => {
            ws.isAlive = true;
            ws.lastActivity = Date.now();
        });

        // Handle messages
        ws.on('message', (message) => {
            ws.lastActivity = Date.now();
            try {
                const data = JSON.parse(message);
                if (data.type === 'ping') {
                    ws.isAlive = true;
                    this._sendToClient(ws, { type: 'pong' });
                }
            } catch (e) {
                console.error(`[WebSocket] Message parse error from ${clientId}:`, e);
            }
        });

        // Handle connection close
        ws.on('close', () => {
            console.log(`[WebSocket] Client ${clientId} disconnected`);
            this.clients.delete(clientId);
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error(`[WebSocket] Error for ${clientId}:`, error);
            ws.terminate();
            this.clients.delete(clientId);
        });
    }

    _sendToClient(ws, data) {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        } catch (error) {
            console.error('[WebSocket] Error sending to client:', error);
            this.clients.delete(ws.clientId);
        }
    }

    broadcast(data) {
        if (!data) {
            console.error('[WebSocket] Attempted to broadcast null/undefined data');
            return;
        }

        // Add ALPR specific logging
        if (data.type === 'ALPR') {
            console.log('[WebSocket] Preparing to broadcast ALPR event:', {
                type: data.type,
                plate: data.data.plateNumber,
                device: data.data.device,
                timestamp: data.data.timestamp
            });
        }

        const message = JSON.stringify(data);
        console.log(`[WebSocket] Broadcasting to ${this.clients.size} clients:`, data);
        
        let successCount = 0;
        this.clients.forEach((ws, clientId) => {
            if (ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(message);
                    successCount++;
                    if (data.type === 'ALPR') {
                        console.log(`[WebSocket] ALPR event sent to client ${clientId}`);
                    }
                } catch (error) {
                    console.error(`[WebSocket] Error sending to ${clientId}:`, error);
                    this.clients.delete(clientId);
                }
            } else {
                console.log(`[WebSocket] Client ${clientId} not ready (state: ${ws.readyState}), removing`);
                this.clients.delete(clientId);
            }
        });
        console.log(`[WebSocket] Successfully broadcast to ${successCount} clients`);
    }
}

// Create and export a single instance
const webSocketService = new WebSocketService();
console.log('[WebSocket] Module loaded');
module.exports = webSocketService;
