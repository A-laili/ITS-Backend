const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
const IntegrationSettingsService = require('../services/integrationSettingsService');

class GenSql {
    constructor() {
        this.pool = null;
        this.settingsService = new IntegrationSettingsService();
    }

    parseConfig(data) {
        logger.info('Parsing database configuration');
        if (!data || !data.config) {
            throw new Error('Invalid settings data');
        }
        
        let config;
        try {
            config = typeof data.config === 'string' ? JSON.parse(data.config) : data.config;
        } catch (err) {
            logger.error('Config parsing failed:', err);
            throw new Error('Invalid config JSON format');
        }

        return {
            host: config['Directory adress'],
            user: config['Username'],
            password: config['Password'],
            port: config['Port']
        };
    }

    async connect() {
        logger.info('Attempting database connection');
        try {
            const settingsData = await this.settingsService.getDefaultSettings();
            logger.debug('Retrieved integration settings');
            
            const parsedConfig = this.parseConfig(settingsData);
            logger.debug(`Connecting to server: ${parsedConfig.host}`);

            this.pool = await mysql.createPool({
                host: parsedConfig.host,
                user: parsedConfig.user,
                password: parsedConfig.password,
                port: parsedConfig.port,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });

            logger.info('Database connection established successfully');
            return this.pool;
        } catch (err) {
            logger.error('Database connection error:', {
                error: err.message,
                stack: err.stack
            });
            throw new Error('Failed to connect to database: ' + err.message);
        }
    }

    async query(queryString, params = []) {
        logger.debug('Executing query:', { query: queryString, params });
        try {
            if (!this.pool) {
                throw new Error('No database connection');
            }
            
            const [results] = await this.pool.execute(queryString, params);
            logger.debug('Query executed successfully');
            return { recordset: results }; // Keep compatibility with old mssql format
        } catch (err) {
            logger.error('Query execution error:', {
                error: err.message,
                query: queryString,
                params,
                stack: err.stack
            });
            throw err;
        }
    }

    async executeParameterizedQuery(queryString, parameters) {
        logger.debug('Executing parameterized query:', { query: queryString, parameters });
        try {
            if (!this.pool) {
                throw new Error('No database connection');
            }
            
            const [results] = await this.pool.execute(queryString, parameters);
            logger.debug('Parameterized query executed successfully');
            return { recordset: results }; // Keep compatibility with old mssql format
        } catch (err) {
            logger.error('Parameterized query execution error:', {
                error: err.message,
                query: queryString,
                parameters,
                stack: err.stack
            });
            throw err;
        }
    }

    async disconnect() {
        logger.info('Disconnecting from database');
        try {
            if (this.pool) {
                await this.pool.end();
                this.pool = null;
                logger.info('Database connection closed successfully');
            }
        } catch (err) {
            logger.error('Error closing connection:', {
                error: err.message,
                stack: err.stack
            });
            throw err;
        }
    }
}

module.exports = GenSql;
