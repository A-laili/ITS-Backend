const IntegrationSettings = require('../models/IntegrationSettings');
const logger = require('../utils/logger');

class IntegrationSettingsService {
    async getDefaultSettings() {
        try {
            const settings = await IntegrationSettings.findOne({
                where: { type: 'Genetec SDK' }
            });
            
            if (!settings) {
                throw new Error('No default integration settings found');
            }
            
            return settings;
        } catch (error) {
            logger.error('Error fetching default integration settings:', error);
            throw error;
        }
    }

    async getAllSettings() {
        try {
            return await IntegrationSettings.findAll();
        } catch (error) {
            logger.error('Error fetching all integration settings:', error);
            throw error;
        }
    }
}

module.exports = IntegrationSettingsService;
