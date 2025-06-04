process.env.PROCESS_TYPE = 'mqtt_cluster';

const { Worker } = require('worker_threads');
const path = require('path');
const mqtt = require('mqtt');
const eventBroker = require('../services/eventBroker');
const IntegrationSettings = require('../models/IntegrationSettings');
const deviceMonitor = require('../services/deviceMonitorService'); // Add this line

async function getMQTTSettings() {
    try {
        const setting = await IntegrationSettings.findOne({
            where: { type: 'MQTT', isEnabled: true }
        });
        return setting;
    } catch (err) {
        console.error('Error fetching MQTT integration settings:', err);
        throw err;
    }
}

async function connectMQTT() {
    try {
        const mqttSetting = await getMQTTSettings();
        if (!mqttSetting) throw new Error('MQTT settings not found');

        const config = mqttSetting.config;
        const client = mqtt.connect(`mqtt://${config["Brocker URL"]}`, {
            username: config["user"],
            password: config["password"],
            clientId: `its_mqtt_cluster_${Math.random().toString(16).slice(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 5000
        });

        const worker = new Worker(path.join(__dirname, '../workers/mqttWorker.js'));

        client.on('connect', () => {
            const topics = [
                'hazen/+/+/status',
                'hazen/+/+/alpr',
                'hazen/+/+/violation',
                'hazen/+/+/cropimage',
                'hazen/+/+/fullimage'
            ];
            topics.forEach(topic => client.subscribe(topic));
        });

        client.on('message', (topic, message) => {
            const messageType = topic.split('/').pop();
            worker.postMessage({
                type: messageType,
                topic,
                message: message.toString()
            });
        });

        worker.on('message', (message) => {
            if (message.type === 'broadcast' && message.success) {
                process.send(message);
            }
        });

        // Handle errors silently but keep connection alive
        client.on('error', () => { });
        worker.on('error', () => { });

        // Cleanup on shutdown
        process.on('SIGTERM', () => {
            client.end();
            worker.terminate();
        });

        // Start device monitoring
        console.log('[MQTT Cluster] Starting device monitor...');
        await deviceMonitor.startMonitoring();

    } catch (error) {
        process.exit(1);
    }
}

// Basic MQTT cluster setup
async function startCluster() {
    console.log('[MQTT Cluster] Starting...');
    // Basic implementation - expand as needed
}

startCluster();
connectMQTT();
