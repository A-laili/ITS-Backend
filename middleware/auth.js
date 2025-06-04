const jwt = require('jsonwebtoken');

// Use a consistent secret key across the application
const JWT_SECRET = '3c39c348325ff2347bc89dc1a5866665658d1c3e6def936660372c05a06dbb39da0cc941e4875c7c34eae9aed17601f395fde335107024508158f093100f4b7f00bf38cb2e2da76dac6135b48bccfa7db924487942c74b0c349389c7a81407608113b03ac93cf5d931f77740e489de58e660f38c82be237dceb8324a65894d1ed5ded6325620d472508d56fe1a7c1f91d8d503888869c83469ddedf22f88f33091ccee96cc52714394f5507d89c8bbe4974517f94693b64ff7887bb3b824346de0224a4fb30c62dffb419ffe6063bcdb4f1c46a57a6c2be5abbaaa7d31ca9b07f70388bc49c4c9cf7eb496bb0853667248f848c453b71f5e3ecae75c4636aa4b';

const authMiddleware = () => {
    return (req, res, next) => {
        try {
            console.log('Auth headers:', req.headers.authorization); // Debug log
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                console.log('No token found'); // Debug log
                return res.status(401).json({ error: 'Authentication required' });
            }

            // Specify the algorithm to match the one used in listener.js
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('Decoded token:', decoded); // Debug log
            req.user = decoded;
            next();
        } catch (err) {
            console.log('Auth error:', err.message); // Debug log
            res.status(401).json({ error: 'Invalid token' });
        }
    };
};

// Export both the middleware and the secret for consistent use
module.exports = { 
    authMiddleware, 
    roleMiddleware: (allowedRoles) => {
        return (req, res, next) => {
            if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Access denied' });
            }
            next();
        };
    },
    JWT_SECRET 
};
