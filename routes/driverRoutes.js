const express = require('express');
const Driver = require('../models/drivers');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware());

// Get all drivers
router.get('/', roleMiddleware(['admin', 'user']), async (req, res) => {
    try {
        const drivers = await Driver.findAll();
        res.status(200).json(drivers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single driver by ID
router.get('/:id', roleMiddleware(['admin', 'user']), async (req, res) => {
    try {
        const driver = await Driver.findByPk(req.params.id);
        if (driver) {
            res.status(200).json(driver);
        } else {
            res.status(404).json({ error: 'Driver not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new driver
router.post('/', roleMiddleware(['admin']), async (req, res) => {
    try {
        const {
            firstName, lastName, dateOfBirth, licenseNumber,
            licenseClass, licenseExpiryDate, phoneNumber,
            email, address, employmentStatus, hireDate, notes
        } = req.body;

        const driver = await Driver.create({
            firstName, lastName, dateOfBirth, licenseNumber,
            licenseClass, licenseExpiryDate, phoneNumber,
            email, address, employmentStatus, hireDate, notes
        });

        res.status(201).json(driver);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update driver
router.put('/:id', roleMiddleware(['admin']), async (req, res) => {
    try {
        const driver = await Driver.findByPk(req.params.id);
        if (driver) {
            await driver.update(req.body);
            res.status(200).json(driver);
        } else {
            res.status(404).json({ error: 'Driver not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete driver
router.delete('/:id', roleMiddleware(['admin']), async (req, res) => {
    try {
        const driver = await Driver.findByPk(req.params.id);
        if (driver) {
            await driver.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Driver not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
