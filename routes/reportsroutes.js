const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const workerPool = require('../workers/workerPool');

// Apply authentication middleware to all routes
router.use(authMiddleware());

// Apply role-based access to all routes
router.use(roleMiddleware(['admin', 'user']));

// Change from /criteria to /filter-options to match frontend
router.get('/filter-options', async (req, res) => {
    try {
        const [results] = await sequelize.query(`
            SELECT DISTINCT
                sitename,
                lp_plateCategory,
                vehicle_vehicleType
            FROM HazenAlpr 
            WHERE sitename IS NOT NULL 
              AND lp_plateCategory IS NOT NULL 
              AND vehicle_vehicleType IS NOT NULL
        `);

        // Ensure we're sending arrays of strings
        const response = {
            locations: Array.from(new Set(results.map(r => String(r.sitename)))),
            categories: ['Private', 'Commercial'],
            vehicleTypes: Array.from(new Set(results.map(r => String(r.vehicle_vehicleType)))),
            eventTypes: ['all', 'ALPR', 'Violation']
        };

        console.log('\n=== Filter Options Response ===');
        console.log(JSON.stringify(response, null, 2));
        console.log('=============================\n');

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search records
router.post('/search', async (req, res) => {
    let query, params;
    try {
        const {
            fromDate,
            toDate,
            eventType,
            plateNumber,
            minSpeed,
            category,
            vehicleType,
            location
        } = req.body;

        let baseQuery = '';
        const params = [];
        // flag to indicate union (eventType 'all')
        const isUnion = eventType !== 'ALPR' && eventType !== 'Violation';

        if (eventType === 'ALPR') {
            baseQuery = `SELECT 
                createdAt as timestamp,
                sitename as location,
                lp_lpOcr as plateNumber,
                lp_plateCategory as category,
                vehicle_vehicleType as vehicleType,
                direction,
                speedmph,
                fullImageFileName,
                vehicle_vehicleImageFileName,
                'ALPR' as eventType
                FROM HazenAlpr WHERE 1=1`;
        } else if (eventType === 'Violation') {
            baseQuery = `SELECT 
                createdAt as timestamp,
                sitename as location,
                lp_lpOcr as plateNumber,
                lp_plateCategory as category,
                vehicle_vehicleType as vehicleType,
                direction,
                speedmph,
                violation_cShotImageFileName as fullImageFileName,
                vehicle_vehicleImageFileName,
                violation_type,
                'Violation' as eventType
                FROM HazenViolation WHERE 1=1`;
        } else {
            baseQuery = `
                SELECT * FROM (
                    SELECT 
                        eventId,
                        createdAt as timestamp,
                        sitename as location,
                        lp_lpOcr as plateNumber,
                        lp_plateCategory as category,
                        vehicle_vehicleType as vehicleType,
                        direction,
                        speedmph,
                        fullImageFileName,
                        vehicle_vehicleImageFileName,
                        'ALPR' as eventType
                    FROM HazenAlpr
                    UNION ALL
                    SELECT 
                        eventId,
                        createdAt as timestamp,
                        sitename as location,
                        lp_lpOcr as plateNumber,
                        lp_plateCategory as category,
                        vehicle_vehicleType as vehicleType,
                        direction,
                        speedmph,
                        violation_cShotImageFileName as fullImageFileName,
                        vehicle_vehicleImageFileName,
                        'Violation' as eventType
                    FROM HazenViolation
                ) combined WHERE 1=1`;
        }

        let query = baseQuery;

        if (fromDate && toDate) {
            query += isUnion
                ? ' AND timestamp BETWEEN :fromDate AND :toDate'
                : ' AND createdAt BETWEEN :fromDate AND :toDate';
            params.push({ fromDate, toDate });
        }

        if (plateNumber) {
            query += isUnion
                ? ' AND plateNumber LIKE :plateNumber'
                : ' AND lp_lpOcr LIKE :plateNumber';
            params.push(`%${plateNumber}%`);
        }

        if (minSpeed) {
            query += ' AND speedmph >= :minSpeed';
            params.push(minSpeed);
        }

        if (category && category !== 'All') {
            query += isUnion
                ? ' AND LOWER(category) = LOWER(:category)'
                : ' AND LOWER(lp_plateCategory) = LOWER(:category)';
            params.push(category);
        }

        if (vehicleType && vehicleType !== 'All') {
            query += isUnion
                ? ' AND vehicleType = :vehicleType'
                : ' AND vehicle_vehicleType = :vehicleType';
            params.push(vehicleType);
        }

        if (location && location !== 'All') {
            query += isUnion
                ? ' AND location = :location'
                : ' AND sitename = :location';
            params.push(location);
        }

        // remains the same as alias "timestamp" is available in all cases
        query += ' ORDER BY timestamp DESC';

        console.log('Query:', query);
        console.log('Params:', params);

        const results = await workerPool.runTask('executeQuery', {
            query: query,
            queryParams: params
        });

        res.json(results || []);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({
            error: error.message,
            details: {
                query: query,
                params: params
            }
        });
    }
});

module.exports = router;