const express = require('express');
const Site = require('../models/Site');
const Device = require('../models/Device');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all sites
router.get('/', authMiddleware(), async (req, res) => {
    try {
        const site = await Site.findAll({
            include: [{
                model: Device,
                attributes: ['name']
            }]
        });
        res.json(site);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new site
router.post('/', authMiddleware(), roleMiddleware(['admin']), async (req, res) => {
    try {
        const site = await Site.create(req.body);
        res.status(201).json(site);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update site
router.put('/:id', authMiddleware(), roleMiddleware(['admin']), async (req, res) => {
    try {
        const [updated] = await Site.update(req.body, {
            where: { id: req.params.id },
            returning: true
        });
        
        if (!updated) {
            return res.status(404).json({ error: 'Site not found' });
        }
        
        const site = await Site.findByPk(req.params.id);
        res.json(site);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete site
router.delete('/:id', authMiddleware(), roleMiddleware(['admin']), async (req, res) => {
    try {
        const deleted = await Site.destroy({
            where: { id: req.params.id }
        });
        
        if (!deleted) {
            return res.status(404).json({ error: 'Site not found' });
        }
        
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
