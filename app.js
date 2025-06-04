const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import the cors package
const morgan = require('morgan'); // Add Morgan import
const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const violationRoutes = require('./routes/violationRoutes');
const statusRoutes = require('./routes/statusRoutes'); // Import the status routes
const networkSettingsRoutes = require('./routes/networkSettingsRoutes'); // Import network settings routes
const generalSettingsRoutes = require('./routes/generalSettingsRoutes'); // Import general settings routes
const roleRoutes = require('./routes/roleRoutes'); // Import role routes
const integrationSettingsRoutes = require('./routes/integrationSettingsRoutes'); // Add this line
const driverRoutes = require('./routes/driverRoutes'); // Add this line
const mappingRoutes = require('./Genetec/Mapping'); // Add this line
const genetecSyncRoutes = require('./routes/genetecSyncRoutes'); // Add this line
const deviceRoutes = require('./routes/deviceRoutes'); // Add this line
const deviceStatusRoutes = require('./routes/deviceStatusRoutes'); // Add this line
const deviceMonitor = require('./services/deviceMonitorService'); // Add this line
const siteRoutes = require('./routes/siteRoutes'); // Add this line
const sysRoutes = require('./routes/sysRoutes'); // Import sysRoutes
const webSocketService = require('./services/webSocketService'); // Add this line
const hazenRoutes = require('./Hazen/hazenroutes'); // Import hazenroutes
const reportsRoutes = require('./routes/reportsroutes'); // Add this line with the other route imports
// Remove or comment out these listener requires:
// require('./hazen/listener_status');
// require('./hazen/listener_alpr');
// require('./hazen/listener_crop');
// require('./hazen/listener_fullimage');
//require('./services/listener'); // Automatically start listener.js via a require statement

const cluster = require('cluster');
const os = require('os');
const { fork } = require('child_process');

/*
if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`Master ${process.pid} is running with ${numCPUs} workers`);

    // Create HTTP server in master process for WebSocket
    const express = require('express');
    const masterApp = express();
    const masterServer = masterApp.listen(3001, () => {
        console.log('Master WebSocket server running on port 3001');
    });

    // Initialize WebSocket in master process
    webSocketService.initialize(masterServer);

    // Initialize broker event handler in master
    const eventBroker = require('./services/eventBroker');
    
    // Handle messages from child processes including mqtt-cluster
    const handleProcessMessage = (msg) => {
        console.log('[Master] Received message:', msg);
        if (msg.type === 'broadcast') {
            console.log('[Master] Broadcasting event to WebSocket clients');
            webSocketService.broadcast(msg.data);
        }
    };

    // Initialize database in master process
    async function initializeMaster() {
        try {
            // Initialize database first
            await sequelize.authenticate();
            console.log('Database connection established in master');
            await sequelize.sync({ force: false });
            
            // Only after database is ready, start workers and other processes
            for (let i = 0; i < numCPUs; i++) {
                const worker = cluster.fork();
                // Listen for messages from worker
                worker.on('message', handleProcessMessage);
            }

            // Start MQTT cluster with message handling
            const mqttProcess = fork('d:/ITS v1.1/server/Hazen/mqtt-cluster.js');
            mqttProcess.on('message', handleProcessMessage);
            console.log('[Master] MQTT cluster process started');

            const startupProcess = fork('d:/ITS v1.1/tasks/startupTasks.js');
            startupProcess.on('message', handleProcessMessage);
        } catch (error) {
            console.error('[Master] Initialization failed:', error);
            process.exit(1);
        }
    }

    initializeMaster();

    // Handle worker messages for request locking
    cluster.on('message', (worker, message) => {
        if (message.type === 'request_lock') {
            for (const id in cluster.workers) {
                cluster.workers[id].send(message);
            }
        }
    });

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died. Forking a new worker...`);
        cluster.fork();
    });
} else {
*/

const app = express();
const server = require('http').createServer(app);
const eventBroker = require('./services/eventBroker'); // Add this line

// Initialize WebSocket service only once at startup
webSocketService.initialize(server);

// Track active connections without timestamps
const activeConnections = new Set();

// Simplified connection tracking
app.use((req, res, next) => {
    const connectionId = req.ip;
    activeConnections.add(connectionId);
    res.on('finish', () => activeConnections.delete(connectionId));
    next();
});

// Add Morgan logger
app.use(morgan('dev'));

// Apply body-parser before routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add custom request logger middleware
app.use((req, res, next) => {
    console.log('\n=== New Request ===');
    console.log('Time:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('==================\n');
    next();
});

// Add request logging after body parsing
app.use((req, res, next) => {
    if (req.method !== 'OPTIONS') {  // Skip logging OPTIONS requests
        console.log('\n=== New Request ===');
        console.log('Time:', new Date().toISOString());
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Body:', req.body);
        console.log('==================\n');
    }
    next();
});

// Update CORS configuration
const corsOptions = {
    origin: true, // Allow all origins for development
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Headers'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Add specific CORS headers for preflight requests
app.options('*', cors(corsOptions));

// Add a middleware to handle CORS preflight
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

app.use(bodyParser.json());
app.use('/api/users', userRoutes);
app.use('/api/violations', violationRoutes);
app.use('/api/status', statusRoutes); // Use the status routes
app.use('/api/network-settings', networkSettingsRoutes); // Use network settings routes
app.use('/api/general-settings', generalSettingsRoutes); // Use general settings routes
app.use('/api/roles', roleRoutes); // Use role routes
app.use('/api/integration-settings', integrationSettingsRoutes); // Add this line
app.use('/api/drivers', driverRoutes); // Add this line
app.use('/api/genetec', mappingRoutes); // Add this line before the sequelize.sync()
app.use('/api/genetec-sync', genetecSyncRoutes); // Add this line before sequelize.sync()
app.use('/api/devices', deviceRoutes); // Add this line
app.use('/api/device-status', deviceStatusRoutes); // Add this line before sequelize.sync()
app.use('/api/sites', siteRoutes); // Add this line before the sequelize.sync()
app.use('/api/sys', sysRoutes); // Mount sysRoutes API
app.use('/api/hazen', hazenRoutes); // Use hazenroutes
app.use('/api/reports', reportsRoutes); // Add this line with the other app.use statements

const port = process.env.PORT || 3000;

// Initialize services in correct order
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established');
        await sequelize.sync({ force: false });

        // Initialize WebSocket first
        console.log('[App] Initializing WebSocket service...');
        webSocketService.initialize(server);

        // Start HTTP server
        server.listen(port, () => {
            console.log(`HTTP Server running on port ${port}`);
            console.log(`WebSocket Server running on ws://localhost:${port}/ws`);
        });

        // Start MQTT cluster and handle its messages in main process
        console.log('[App] Starting MQTT cluster...');
        const mqttProcess = fork('./Hazen/mqtt-cluster.js');

        // Handle messages from MQTT cluster
        mqttProcess.on('message', (msg) => {
            if (msg.type === 'broadcast' && msg.success && msg.data) {
                console.log('[App] Received MQTT broadcast:', msg.data.type);
                // Use the EventBroker in the main process
                eventBroker.publish('newEvent', msg.data);
            }
        });

        // Verify EventBroker subscription
        eventBroker.listSubscriptions();

        // Start startup tasks with error handling
        const startupProcess = fork('./tasks/startupTasks.js')
            .on('error', (error) => {
                console.error('Startup tasks error:', error);
            });

    } catch (error) {
        console.error('Server initialization failed:', error);
        // Don't exit process on initialization error
        console.error('Continuing despite initialization error');
    }
}

// Prevent multiple server instances
let isStarting = false;
if (!isStarting) {
    isStarting = true;
    startServer();
}

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

// Handle uncaught errors without crashing
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

//} // Remove the closing brace of the else block
