const logger = require('../utils/logger');
const Driver = require('../models/Drivers');

class DriverService {
    _sanitizeDriverData(driverData) {
        const sanitized = { ...driverData };
        ['email', 'phoneNumber', 'notes', 'licenseNumber'].forEach(field => {
            if (sanitized[field] === '') {
                sanitized[field] = null;
            }
        });

        // Ensure metadata is properly formatted
        if (sanitized.metadata) {
            try {
                sanitized.metadata = typeof sanitized.metadata === 'string'
                    ? JSON.parse(sanitized.metadata)
                    : sanitized.metadata;
            } catch (e) {
                logger.warn('Invalid metadata format, using empty object');
                sanitized.metadata = {};
            }
        } else {
            sanitized.metadata = {};
        }

        return sanitized;
    }

    async createDriver(driverData) {
        try {
            const sanitizedData = this._sanitizeDriverData(driverData);
            const driver = await Driver.create(sanitizedData);
            logger.info(`Driver created: ${driver.firstName} ${driver.lastName}`);
            return driver;
        } catch (error) {
            logger.error('Error creating driver:', error);
            throw error;
        }
    }

    async updateDriver(externalId, driverData) {
        try {
            const sanitizedData = this._sanitizeDriverData(driverData);

            const [driver, created] = await Driver.findOrCreate({
                where: { externalId },
                defaults: sanitizedData
            });

            if (!created) {
                await driver.update(sanitizedData);
            }

            logger.info(`Driver ${created ? 'created' : 'updated'}: ${driver.firstName} ${driver.lastName}`);
            return driver;
        } catch (error) {
            logger.error('Error updating driver:', error);
            throw error;
        }
    }
}

module.exports = new DriverService();
