const express = require('express');
const router = express.Router();
const GenSync = require('../Genetec/Gen_sync');
const logger = require('../utils/logger');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const genSync = new GenSync('http://localhost:3000'); // Use your actual API base URL

// Protect all routes with authentication
router.use(authMiddleware());

// Only allow admin and supervisor roles to sync
router.post('/sync-cardholders', roleMiddleware(['admin', 'supervisor']), async (req, res) => {
    try {
        logger.info(`Starting Genetec sync by user: ${req.user.id}`);
        await genSync.syncToDrivers();
        res.json({ message: 'Synchronization completed successfully' });
    } catch (error) {
        logger.error('Sync endpoint error:', error);
        res.status(500).json({ 
            error: 'Synchronization failed',
            details: error.message 
        });
    }
});

// Protect cardholders endpoint
router.get('/cardholders', roleMiddleware(['admin', 'supervisor']), async (req, res) => {
    try {
        logger.info('Fetching Genetec cardholders');
        const cardholders = await genSync.getCardholders();
        res.json(cardholders);
    } catch (error) {
        logger.error('Fetch cardholders error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch cardholders',
            details: error.message 
        });
    }
});

module.exports = router;
