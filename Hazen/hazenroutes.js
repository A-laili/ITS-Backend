const { Op } = require('sequelize');
const express = require('express');
const router = express.Router();
const CropImage = require('./hazen_models/CropImage');
const FullImage = require('./hazen_models/FullImage'); // Add this line
const fs = require('fs').promises;
const path = require('path');
const Sys = require('../models/sys');  // Changed from '../../models/sys' to '../models/sys'
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Helper function to mount network share
async function mountNetworkShare(filePath) {
    try {
        if (filePath.startsWith('\\\\') || filePath.startsWith('//')) {
            const userSetting = await Sys.findOne({ where: { key: 'videopathuser' } });
            const pwSetting = await Sys.findOne({ where: { key: 'videopathpw' } });

            if (!userSetting || !pwSetting) {
                throw new Error('Network credentials not found in system settings');
            }

            const sharePath = path.dirname(filePath);
            await execPromise(`net use "${sharePath}" /user:${userSetting.value} ${pwSetting.value}`);
            console.log(`Network path mounted: ${sharePath}`);
        }
    } catch (error) {
        console.error('Error mounting network share:', error);
        throw error;
    }
}

// Add this helper function at the top of the file with other helpers
async function waitForFile(filePath, maxAttempts = 3, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const exists = await fs.access(filePath)
            .then(() => true)
            .catch(() => false);
        
        if (exists) return true;
        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    return false;
}

// Modify the cropimage route handler
router.get('/cropimage/file/:fileName', async (req, res) => {
    try {
        const image = await CropImage.findOne({
            where: {
                fileName: {
                    [Op.like]: `%${req.params.fileName}%`
                }
            },
            order: [['createdAt', 'DESC']]
        });

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in database',
                fileExists: false
            });
        }

        try {
            // Mount network share first if needed
            await mountNetworkShare(image.image);

            // Wait for file with retries
            const fileExists = await waitForFile(image.image, 3, 1000);

            if (!fileExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Image file not available after multiple attempts',
                    fileExists: false
                });
            }

            const imageBuffer = await fs.readFile(image.image);
            
            // Rest of the existing code remains the same
            const ext = path.extname(image.image).toLowerCase();
            const contentType = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            }[ext] || 'application/octet-stream';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', imageBuffer.length);
            res.send(imageBuffer);

        } catch (fileError) {
            console.error('File read error:', fileError);
            return res.status(404).json({
                success: false,
                message: 'Image file not found or inaccessible on server',
                path: image.image,
                error: fileError.message
            });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving image',
            error: error.message
        });
    }
});

// Get full image by filename
router.get('/fullimage/file/:fileName', async (req, res) => {
    try {
        const image = await FullImage.findOne({
            where: {
                fileName: {
                    [Op.like]: `%${req.params.fileName}%`
                }
            },
            order: [['createdAt', 'DESC']]
        });

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found in database',
                fileExists: false
            });
        }

        try {
            const fileExists = await fs.access(image.image)
                .then(() => true)
                .catch(() => false);

            if (!fileExists) {
                return res.status(202).json({
                    success: false,
                    message: 'Image file not ready yet',
                    fileExists: false
                });
            }

            await mountNetworkShare(image.image);

            const imageBuffer = await fs.readFile(image.image);

            const ext = path.extname(image.image).toLowerCase();
            const contentType = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif'
            }[ext] || 'application/octet-stream';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', imageBuffer.length);
            res.send(imageBuffer);

        } catch (fileError) {
            console.error('File read error:', fileError);
            return res.status(404).json({
                success: false,
                message: 'Image file not found or inaccessible on server',
                path: image.image,
                error: fileError.message
            });
        }
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving image',
            error: error.message
        });
    }
});

module.exports = router;