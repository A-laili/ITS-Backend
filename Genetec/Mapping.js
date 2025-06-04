const express = require('express');
const router = express.Router();
const GenSql = require('./Gen_sql');
const logger = require('../utils/logger');

const genSql = new GenSql();

// Helper function to execute queries with connection management
async function executeQuery(query, params = []) {
    try {
        await genSql.connect();
        const result = await genSql.query(query, params);
        return result;
    } finally {
        await genSql.disconnect();
    }
}

// Get all cameras
router.get('/cameras', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                CameraEntity.ID,
                CameraEntity.Name,
                CameraEntity.Description
            FROM CameraEntity
        `);
        res.json(result.recordset);
    } catch (error) {
        logger.error('Error fetching cameras:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                UserEntity.ID,
                UserEntity.FirstName,
                UserEntity.LastName,
                UserEntity.Email
            FROM UserEntity
        `);
        res.json(result.recordset);
    } catch (error) {
        logger.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all events
router.get('/events', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                EventEntity.ID,
                EventEntity.Name,
                EventEntity.Description,
                EventEntity.Timestamp
            FROM EventEntity
        `);
        res.json(result.recordset);
    } catch (error) {
        logger.error('Error fetching events:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all alarms
router.get('/alarms', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                AlarmEntity.ID,
                AlarmEntity.Name,
                AlarmEntity.Priority,
                AlarmEntity.State
            FROM AlarmEntity
        `);
        res.json(result.recordset);
    } catch (error) {
        logger.error('Error fetching alarms:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all cardholders
router.get('/cardholders', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                Cardholder.ID,
                Cardholder.FirstName,
                Cardholder.LastName,
                Cardholder.Email,
                Cardholder.Status,
                Cardholder.Description,
                Cardholder.Picture
            FROM [dbo].[Cardholder]
        `);
        res.json(result.recordset);
    } catch (error) {
        logger.error('Error fetching cardholders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get cardholder by ID
router.get('/cardholders/:id', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                Cardholder.ID,
                Cardholder.FirstName,
                Cardholder.LastName,
                Cardholder.Email,
                Cardholder.Status,
                Cardholder.Description,
                Cardholder.Picture
            FROM [dbo].[Cardholder]
            WHERE ID = @param0
        `, [req.params.id]);
        res.json(result.recordset[0]);
    } catch (error) {
        logger.error('Error fetching cardholder:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all credentials
router.get('/credentials', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                Credential.ID,
                Credential.CardholderID,
                Credential.Status,
                Credential.CardFormat,
                Credential.CardNumber,
                Credential.ExpiryTime,
                Credential.ActivationTime
            FROM [dbo].[Credential]
        `);
        res.json(result.recordset);
    } catch (error) {
        logger.error('Error fetching credentials:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get credentials by cardholder ID
router.get('/cardholders/:id/credentials', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                Credential.ID,
                Credential.CardholderID,
                Credential.Status,
                Credential.CardFormat,
                Credential.CardNumber,
                Credential.ExpiryTime,
                Credential.ActivationTime
            FROM [dbo].[Credential]
            WHERE CardholderID = @param0
        `, [req.params.id]);
        res.json(result.recordset);
    } catch (error) {
        logger.error('Error fetching credentials for cardholder:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
