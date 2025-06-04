const express = require('express');
const router = express.Router();
const deviceMonitor = require('../services/deviceMonitorService');
const { authMiddleware } = require('../middleware/auth');

// Start monitoring service
router.post('/monitor/start', authMiddleware(), async (req, res) => {
    try {
        await deviceMonitor.startMonitoring(); // Changed from start() to startMonitoring()
        res.json({ message: 'Device monitoring started' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stop monitoring service
router.post('/monitor/stop', authMiddleware(), async (req, res) => {
    try {
        await deviceMonitor.stopMonitoring(); // Changed from stop() to stopMonitoring()
        res.json({ message: 'Device monitoring stopped' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check specific device
router.get('/:deviceId', authMiddleware(), async (req, res) => {
    try {
        const device = await Device.findByPk(req.params.deviceId);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        const result = await deviceMonitor.checkDevice(device); // Now passing device object instead of just ID
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update monitoring settings
router.post('/settings', authMiddleware(), async (req, res) => {
    try {
        const { interval, timeout } = req.body;
        deviceMonitor.updateSettings({ interval, timeout }); // Changed to use updateSettings method
        res.json({ message: 'Settings updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
