const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const NetworkSettings = require('../models/NetworkSettings');

// Protect all routes
router.use(authMiddleware());

router.get('/latest', async (req, res) => {
    try {
        console.log('Fetching latest network settings');
        const settings = await NetworkSettings.findOne({
            order: [['createdAt', 'DESC']]
        });
        
        if (!settings) {
            return res.status(200).json({
                server: '',
                username: '',
                password: '',
                database: ''
            });
        }
        
        console.log('Found settings:', settings.toJSON());
        res.json(settings);
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// Only admin can modify settings
router.post('/', roleMiddleware(['admin']), async (req, res) => {
    try {
        console.log('Creating new settings:', req.body);
        const settings = await NetworkSettings.create(req.body);
        console.log('Settings created:', settings.toJSON());
        res.status(201).json(settings);
    } catch (err) {
        console.error('Error creating settings:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all network settings
router.get('/', async (req, res) => {
    try {
        const settings = await NetworkSettings.findAll();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get network settings by ID
router.get('/:id', async (req, res) => {
    try {
        const settings = await NetworkSettings.findByPk(req.params.id);
        if (settings) {
            res.status(200).json(settings);
        } else {
            res.status(404).json({ error: 'Network settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update network settings by ID
router.put('/:id', async (req, res) => {
    try {
        const settings = await NetworkSettings.findByPk(req.params.id);
        if (settings) {
            await settings.update(req.body);
            res.status(200).json(settings);
        } else {
            res.status(404).json({ error: 'Network settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete network settings by ID
router.delete('/:id', async (req, res) => {
    try {
        const settings = await NetworkSettings.findByPk(req.params.id);
        if (settings) {
            await settings.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Network settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
