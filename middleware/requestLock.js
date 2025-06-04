const cluster = require('cluster');

// Shared request lock state
const lockState = new Map();

// Handle messages from master
process.on('message', (message) => {
    if (message.type === 'request_lock') {
        if (message.action === 'acquire') {
            lockState.set(message.key, message.workerId);
        } else if (message.action === 'release') {
            lockState.delete(message.key);
        }
    }
});

const requestLocks = new Map();

function requestLock(req, res, next) {
    // Skip lock for OPTIONS requests
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        // Get user ID from body or query or params
        const userId = (req.body && req.body.id) || 
                      (req.query && req.query.id) || 
                      (req.params && req.params.id) ||
                      'anonymous';

        const requestKey = `${userId}-${req.method}-${req.path}`;
        
        if (requestLocks.has(requestKey)) {
            return res.status(429).json({
                error: 'Request in progress, please wait'
            });
        }

        requestLocks.set(requestKey, Date.now());

        res.on('finish', () => {
            requestLocks.delete(requestKey);
        });

        next();
    } catch (error) {
        console.error('RequestLock middleware error:', error);
        next();
    }
}

module.exports = requestLock;
