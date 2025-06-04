require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const Sys = require('../models/sys');
const router = express.Router();

function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
}

router.post('/generate', async (req, res) => {
    try {
        if (!process.env.INTEGRATION_SETTINGS_TOKEN) {
            return res.status(500).json({ error: 'Missing INTEGRATION_SETTINGS_TOKEN' });
        }
        // Check if "username" and "password" already exist
        const existingUsername = await Sys.findOne({ where: { key: 'username' } });
        const existingPassword = await Sys.findOne({ where: { key: 'password' } });
        if (existingUsername && existingPassword) {
            return res.status(200).json({ message: 'Sys values already generated.' });
        }
        
        // Derive a 32-byte key from the token
        const key = crypto.createHash('sha256').update(process.env.INTEGRATION_SETTINGS_TOKEN).digest();
        // Generate random username and password
        const rawUsername = crypto.randomBytes(6).toString('hex');
        const rawPassword = crypto.randomBytes(6).toString('hex');
        const encUsername = encrypt(rawUsername, key);
        const encPassword = encrypt(rawPassword, key);
        // Insert records if they do not already exist
        if (!existingUsername) {
            await Sys.create({ key: 'username', value: encUsername });
        }
        if (!existingPassword) {
            await Sys.create({ key: 'password', value: encPassword });
        }
        res.status(201).json({
            message: 'Sys values generated',
            username: rawUsername,
            password: rawPassword
        });
    } catch (err) {
        console.error('Error generating Sys values:', err);
        res.status(500).json({ error: err.message });
    }
});

router.post('/store', async (req, res) => {
    const { key, value } = req.body;
    if (!key || !value) {
        return res.status(400).json({ error: 'Missing key or value in request body.' });
    }
    try {
        let record = await Sys.findOne({ where: { key } });
        if (record) {
            record.value = value;
            await record.save();
        } else {
            record = await Sys.create({ key, value });
        }
        res.status(200).json({ message: 'Record stored successfully.', record });
    } catch (err) {
        console.error('Error storing sys record:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
