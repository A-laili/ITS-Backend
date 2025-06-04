const express = require('express');
const requestLock = require('../middleware/requestLock');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { authMiddleware, roleMiddleware, JWT_SECRET } = require('../middleware/auth');
const workerPool = require('../workers/workerPool');

// Apply distributed request lock instead of simple request guard
router.use(requestLock);

// Public routes
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        console.log('Attempting to find user:', username);
        const user = await workerPool.runTask('findUser', { username });
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        console.log('User found, verifying password');
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', username);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        console.log('Password verified, generating token');
        const token = jwt.sign(
            { 
                id: user.id, 
                roleId: user.roleId,
                username: user.username,
                role: user.Role?.name // Make role access safe
            }, 
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        console.log('Login successful for user:', username);
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.Role?.name
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'An error occurred during login',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

router.post('/register', async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['username', 'password', 'email', 'phone', 'company', 'project', 'supervisor', 'roleId'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }

        console.log('Attempting to create user:', {
            ...req.body,
            password: '[REDACTED]'
        });

        const result = await workerPool.runTask('createUser', req.body);
        console.log('User created successfully:', {
            ...result,
            password: '[REDACTED]'
        });
        
        res.status(201).json(result);
    } catch (err) {
        console.error('User registration error:', err);
        res.status(500).json({ 
            error: err.message || 'Error creating user',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Protected routes
router.use(authMiddleware());

router.get('/', roleMiddleware(['admin']), async (req, res) => {
    try {
        const users = await workerPool.runTask('findAllUsers');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', roleMiddleware(['admin']), async (req, res) => {
    try {
        console.log('Update user request:', {
            params: req.params,
            body: req.body,
            user: req.user // Log the authenticated user info
        });
        
        const result = await workerPool.runTask('updateUser', {
            id: req.params.id,
            data: req.body
        });
        
        console.log('User updated successfully:', result);
        res.status(200).json(result);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', roleMiddleware(['admin']), async (req, res) => {
    try {
        await workerPool.runTask('deleteUser', { id: req.params.id });
        res.status(204).end();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/refresh-token', async (req, res) => {
    try {
        // Get token from body or Authorization header
        let token = req.body.token;
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await workerPool.runTask('findUser', { id: decoded.id });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const newToken = jwt.sign(
                { 
                    id: user.id, 
                    roleId: user.roleId,
                    username: user.username,
                    role: user.Role.name 
                }, 
                JWT_SECRET, 
                { expiresIn: '1h' }
            );

            res.json({ token: newToken });
        } catch (jwtError) {
            // Handle expired or invalid tokens specifically
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
            }
            throw jwtError;
        }
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
