require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const IntegrationSettings = require('../models/IntegrationSettings'); // New: require IntegrationSettings model
const Status = require('./hazen_models/Status'); // New: require Status model

// New helper function to fetch MQTT settings from the database
async function getMQTTSettings() {
    try {
        const setting = await IntegrationSettings.findOne({ where: { type: 'MQTT', isEnabled: true } });
        return setting;
    } catch (err) {
        console.error('Error fetching MQTT integration settings from DB:', err);
        throw err;
    }
}

async function startListener() {
    let mqttSetting;
    try {
        mqttSetting = await getMQTTSettings();
        if (!mqttSetting) {
            console.error('MQTT integration settings not found.');
            return;
        }
        // mqttSetting.config is already parsed by the model getter
    } catch (err) {
        console.error('Error fetching MQTT integration settings:', err);
        return;
    }

    const config = mqttSetting.config; // use the config from DB directly
    const brokerUrl = config["Brocker URL"];
    const options = {
        username: config["user"],
        password: config["password"]
    };

    // Connect to the MQTT broker
    const client = mqtt.connect(`mqtt://${brokerUrl}`, options);

    client.on('connect', () => {
        console.log('Connected to MQTT broker');
        // Read only the status topic configuration from status.json
        const statusFile = path.join(__dirname, 'topics', 'status.json');
        fs.readFile(statusFile, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading status file ${statusFile}:`, err);
                return;
            }
            try {
                const json = JSON.parse(data);
                const topic = json.topic;
                if (topic) {
                    client.subscribe(topic, (err) => {
                        if (err) {
                            console.error(`Failed to subscribe to topic ${topic}: ${err}`);
                        } else {
                            console.log(`Subscribed to topic: ${topic}`);
                        }
                    });
                }
            } catch (e) {
                console.error(`Error parsing JSON in file ${statusFile}:`, e);
            }
        });
    });

    client.on('message', (topic, message) => {
        console.log(`Received message on ${topic}`);
        try {
            const payload = JSON.parse(message.toString());
            // Extract device from topic assuming format "hazen/vistapro/<device>/status"
            const tokens = topic.split('/');
            const device = tokens[2] || 'unknown';
            const statusValue = payload.status || 'unknown';
            // Save using Status model
            Status.create({ device, status: statusValue })
                .then(result => console.log('Status saved'))
                .catch(err => console.error('Error saving status:', err));
        } catch (e) {
            console.error('Error processing message:', e);
        }
        // ...additional processing...
    });

    client.on('error', (err) => {
        console.error('MQTT client error:', err);
    });
}

startListener();
// ...existing code...
