const ping = require('ping');
const Device = require('../models/Device');
const logger = require('../utils/logger');

class DeviceMonitorService {
    constructor() {
        // Ensure only one instance is created
        if (DeviceMonitorService.instance) {
            return DeviceMonitorService.instance;
        }
        DeviceMonitorService.instance = this;

        this.isRunning = false;
        this.interval = 30000; // 30 seconds
        this.timeout = 2000;   // 2 seconds
        this.monitoringInterval = null;
    }

    async startMonitoring() {
        /*// Only start monitoring if we're in the MQTT cluster process
        if (process.env.PROCESS_TYPE !== 'mqtt_cluster') {
            logger.info('Device monitoring skipped - not in MQTT cluster process');
            return;
        }*/

        if (this.monitoringInterval) {
            logger.info('Monitoring already running');
            return;
        }

        logger.info('Starting device monitoring service...');
        this.isRunning = true;

        // Start immediate check
        await this.checkAllDevices();

        // Set up continuous monitoring
        this.monitoringInterval = setInterval(async () => {
            await this.checkAllDevices();
        }, this.interval);

        logger.info(`Device monitoring service started with ${this.interval}ms interval`);
    }

    async stopMonitoring() {
        if (this.monitoringInterval) {
            if (this.isRunning) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }
        }
        this.isRunning = false;
        logger.info('Device monitoring service stopped');
    }

    async checkAllDevices() {
        try {
            const devices = await Device.findAll();
            logger.info(`Checking ${devices.length} devices...`);

            const results = await Promise.allSettled(
                devices.map(device => this.checkDevice(device))
            );

            const summary = {
                total: devices.length,
                online: results.filter(r => r.status === 'fulfilled' && r.value.isOnline).length,
                offline: results.filter(r => r.status === 'fulfilled' && !r.value.isOnline).length,
                errors: results.filter(r => r.status === 'rejected').length
            };

            logger.info('Device check summary:', summary);
        } catch (error) {
            logger.error('Error in checkAllDevices:', error);
        }
    }

    async checkDevice(device) {
        try {
            const isOnline = await this._pingDevice(device.ipAddress);
            const statusChanged = device.isOnline !== isOnline;

            if (statusChanged) {
                await device.update({
                    isOnline,
                    lastSeen: isOnline ? new Date() : device.lastSeen
                });

                logger.info(
                    `Device ${device.name} (${device.ipAddress}) status changed to ${isOnline ? 'online' : 'offline'}`
                );
            }

            return { deviceId: device.id, isOnline, statusChanged };
        } catch (error) {
            logger.error(`Error checking device ${device.name}:`, error);
            throw error;
        }
    }

    async _pingDevice(ipAddress) {
        try {
            const result = await ping.promise.probe(ipAddress, {
                timeout: this.timeout / 1000,
                extra: ['-i', '2']
            });
            return result.alive;
        } catch (error) {
            logger.error(`Ping failed for ${ipAddress}:`, error);
            return false;
        }
    }

    updateSettings(newSettings) {
        const { interval, timeout } = newSettings;

        if (interval && interval !== this.interval) {
            this.interval = interval;
            if (this.isRunning) {
                this.stopMonitoring();
                this.startMonitoring();
            }
            logger.info(`Monitor interval updated to ${interval}ms`);
        }

        if (timeout) {
            this.timeout = timeout;
            logger.info(`Ping timeout updated to ${timeout}ms`);
        }
    }
}

module.exports = new DeviceMonitorService();
