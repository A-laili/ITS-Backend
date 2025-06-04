const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Handle both GET and POST requests
const dbStatusHandler = async (req, res) => {
    try {
        // Get parameters from either query (GET) or body (POST)
        const params = req.method === 'GET' ? req.query : req.body;
        const { username, password, database, host } = params;

        console.log('Testing database connection:', {
            host,
            database,
            username,
            authenticated: !!req.user
        });

        // Create a test connection
        const connection = await mysql.createConnection({
            host: host,
            user: username,
            password: password,
            database: database
        });

        // Test the connection
        await connection.connect();
        
        // Close the connection
        await connection.end();

        console.log('Database connection successful');
        res.status(200).json({ 
            status: 'Database connection is healthy and operational',
            details: {
                host,
                database,
                username,
                authenticated: true
            }
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({ 
            error: 'Database connection failed: ' + error.message,
            details: {
                host,
                database,
                username,
                authenticated: false
            }
        });
    }
};

// Apply authentication middleware to both routes
router.get('/db-status', [authMiddleware(), roleMiddleware(['admin'])], dbStatusHandler);
router.post('/db-status', [authMiddleware(), roleMiddleware(['admin'])], dbStatusHandler);

module.exports = router;
