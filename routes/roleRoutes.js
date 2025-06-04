const express = require('express');
const Role = require('../models/Role');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Debug middleware
router.use((req, res, next) => {
    console.log('Role route headers:', req.headers);
    next();
});

// Apply authentication middleware properly
router.use(authMiddleware());
router.use(roleMiddleware(['admin']));

// Get all roles
router.get('/', async (req, res) => {
    try {
        const roles = await Role.findAll();
        res.status(200).json(roles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get role by ID
router.get('/:id', async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (role) {
            res.status(200).json(role);
        } else {
            res.status(404).json({ error: 'Role not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new role
router.post('/', async (req, res) => {
    try {
        const newRole = await Role.create(req.body);
        res.status(201).json(newRole);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update role by ID
router.put('/:id', async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (role) {
            await role.update(req.body);
            res.status(200).json(role);
        } else {
            res.status(404).json({ error: 'Role not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message }); // Fixed: removed curly braces around 500
    }
});

// Delete role by ID
router.delete('/:id', async (req, res) => {
    try {
        const role = await Role.findByPk(req.params.id);
        if (role) {
            await role.destroy();
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Role not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
