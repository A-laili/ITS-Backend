require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const IntegrationSettings = require('../models/IntegrationSettings'); // remains same

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
        // Update topics path: from the new location, topics folder is now in ../Hazen/topics
        const topicsDir = path.join(__dirname, '../Hazen/topics');
        fs.readdir(topicsDir, (err, files) => {
            if (err) {
                console.error('Error reading topics directory:', err);
                return;
            }
            files.filter(file => file.endsWith('.json')).forEach(file => {
                const filePath = path.join(topicsDir, file);
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error(`Error reading file ${filePath}:`, err);
                        return;
                    }
                    try {
                        const json = JSON.parse(data);
                        const topic = json.topic;
                        if (topic) {
                            client.subscribe(topic, (err) => {
                                if (err) {
                                    console.error(`Failed to subscribe to topic ${topic}:`, err);
                                } else {
                                    console.log(`Subscribed to topic: ${topic}`);
                                }
                            });
                        }
                    } catch (e) {
                        console.error(`Error parsing JSON in file ${filePath}:`, e);
                    }
                });
            });
        });
    });

    client.on('message', (topic, message) => {
        console.log(`Received message on ${topic}: ${message.toString()}`);
        // ...existing code or additional processing...
    });

    client.on('error', (err) => {
        console.error('MQTT client error:', err);
    });
}

startListener();
// ...existing code...
