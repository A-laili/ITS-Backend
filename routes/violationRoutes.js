const express = require('express');
const Violation = require('../models/PV_violation');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware());

router.post('/', roleMiddleware(['admin', 'supervisor', 'PV']), async (req, res) => {
    try {
        const { violationId, violationTime, sitename, violationType, description, driverid, driver, driver_init_points, driver_final_points, driver_points_lost, ticketref, date, status, sendto, notification, notificationDate, userId } = req.body;
        const violation = await Violation.create({ violationId, violationTime, sitename, violationType, description, driverid, driver, driver_init_points, driver_final_points, driver_points_lost, ticketref, date, status, sendto, notification, notificationDate, userId });
        res.status(201).json(violation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/', roleMiddleware(['admin', 'supervisor', 'user']), async (req, res) => {
    try {
        const violations = await Violation.findAll();
        res.status(200).json(violations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
