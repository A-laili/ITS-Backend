const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const GeneralSettings = require('../models/GeneralSettings');

// Protect all routes
router.use(authMiddleware());

router.get('/latest', async (req, res) => {
    try {
        console.log('Fetching latest general settings');
        const settings = await GeneralSettings.findOne({
            order: [['createdAt', 'DESC']]
        });
        
        if (!settings) {
            return res.status(200).json({
                imagePath: '',
                videoPath: '',
                adminRole: '',
                userRole: '',
                hitDays: 30,
                hitImageDays: 30,
                readDays: 30,
                readImageDays: 30,
                eventDays: 30,
                violationDays: 30
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
        const settings = await GeneralSettings.create(req.body);
        console.log('Settings created:', settings.toJSON());
        res.status(201).json(settings);
    } catch (err) {
        console.error('Error creating settings:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const settings = await GeneralSettings.findAll();
        res.status(200).json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get general settings by ID
router.get('/:id', async (req, res) => {
    try {
        const settings = await GeneralSettings.findByPk(req.params.id);
        if (settings) {
            res.status(200).json(settings);
        } else {
            res.status(404).json({ error: 'General settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update general settings by ID
router.put('/:id', async (req, res) => {
    try {
        const settings = await GeneralSettings.findByPk(req.params.id);
        if (settings) {
            await settings.update(req.body);
            res.status(200).json(settings);
        } else {
            res.status(404).json({ error: 'General settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete general settings by ID
router.delete('/:id', async (req, res) => {
    try {
        const settings = await GeneralSettings.findByPk(req.params.id);
        if (settings) {
            await settings.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'General settings not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
