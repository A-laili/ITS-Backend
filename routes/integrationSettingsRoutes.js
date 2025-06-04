const express = require('express');
const IntegrationSettings = require('../models/IntegrationSettings');
const { authMiddleware } = require('../middleware/auth'); // added auth middleware import
const router = express.Router();

router.use(authMiddleware()); // applied authentication middleware to all routes

// Get all integration settings
router.get('/', async (req, res) => {
    try {
        const settings = await IntegrationSettings.findAll();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get integration settings by ID
router.get('/:id', async (req, res) => {
    try {
        const settings = await IntegrationSettings.findByPk(req.params.id);
        if (settings) {
            res.status(200).json(settings);
        } else {
            res.status(404).json({ error: 'Integration settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new integration settings
router.post('/', async (req, res) => {
    try {
        const newSettings = await IntegrationSettings.create(req.body);
        res.status(201).json(newSettings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update integration settings by ID
router.put('/:id', async (req, res) => {
    try {
        const settings = await IntegrationSettings.findByPk(req.params.id);
        if (settings) {
            await settings.update(req.body);
            res.status(200).json(settings);
        } else {
            res.status(404).json({ error: 'Integration settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete integration settings by ID
router.delete('/:id', async (req, res) => {
    try {
        const settings = await IntegrationSettings.findByPk(req.params.id);
        if (settings) {
            await settings.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Integration settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
