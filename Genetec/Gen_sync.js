const GenSql = require('./Gen_sql');
const logger = require('../utils/logger');
const driverService = require('../services/driverService');
const IntegrationSettingsService = require('../services/integrationSettingsService');
const fieldMapper = require('../services/fieldMapperService');

class GenSync {
    constructor(apiBaseUrl) {
        this.genSql = new GenSql();
        this.apiBaseUrl = apiBaseUrl;
        this.settingsService = new IntegrationSettingsService();
    }

    async getCardholders() {
        try {
            const settings = await this.settingsService.getDefaultSettings();
            const config = typeof settings.config === 'string' ? 
                JSON.parse(settings.config) : settings.config;
            
            const dbName = config['Directory name'];
            if (!dbName) {
                throw new Error('Database name not found in integration settings');
            }

            await this.genSql.connect();
            const query = `
                SELECT 
                    Guid,
                    FirstName,
                    LastName,
                    Email,
                    Status,
                    ExpirationDate,
                    ActivationDate,
                    MobilePhoneNumber,
                    Info as Description,
                    Picture,
                    Thumbnail,
                    CanEscort,
                    MandatoryEscort
                FROM [${dbName}].[dbo].[Cardholder]
                WHERE Status = '0'
                AND (ExpirationDate IS NULL OR ExpirationDate > GETDATE())
                AND (ActivationDate IS NULL OR ActivationDate <= GETDATE())
            `;
            
            const result = await this.genSql.query(query);
            return result.recordset;
        } catch (error) {
            logger.error('Error fetching cardholders:', error);
            throw error;
        } finally {
            await this.genSql.disconnect();
        }
    }

    async syncToDrivers() {
        try {
            const cardholders = await this.getCardholders();
            logger.info(`Found ${cardholders.length} cardholders to sync`);

            for (const cardholder of cardholders) {
                try {
                    // Map Genetec fields to Driver fields using the mapper
                    const driverData = fieldMapper.mapFields(cardholder);

                    await driverService.updateDriver(cardholder.Guid, driverData);
                    logger.info(`Successfully synced driver: ${cardholder.FirstName} ${cardholder.LastName}`);
                } catch (error) {
                    logger.error(`Failed to sync driver ${cardholder.Guid}:`, error.message);
                    continue;
                }
            }
            
            logger.info('Sync completed');
        } catch (error) {
            logger.error('Sync process failed:', error);
            throw error;
        }
    }

    _determineStatus(cardholder) {
        if (cardholder.Status !== 'active') return 'INACTIVE';
        
        const now = new Date();
        if (cardholder.ExpirationDate && new Date(cardholder.ExpirationDate) < now) return 'EXPIRED';
        if (cardholder.ActivationDate && new Date(cardholder.ActivationDate) > now) return 'PENDING';
        
        return 'ACTIVE';
    }
}

module.exports = GenSync;
