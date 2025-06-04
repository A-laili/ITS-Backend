require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const IntegrationSettings = require('../models/IntegrationSettings');
const FullImage = require('./hazen_models/FullImage');
const GeneralSettings = require('../models/GeneralSettings'); // new import
const Sys = require('../models/sys');
const { exec } = require('child_process');

// Helper: fetch MQTT settings from database
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
    } catch (err) {
        console.error('Error fetching MQTT integration settings:', err);
        return;
    }

    // Retrieve image folder from GeneralSettings.imagePath (using the most recent record)
    let imagesDir;
    try {
        const setting = await GeneralSettings.findOne({ order: [['createdAt', 'DESC']] });
        imagesDir = setting ? setting.imagePath : process.env.IMAGE_FOLDER || path.join(__dirname, 'images');
    } catch (err) {
        console.error('Error fetching GeneralSettings:', err);
        imagesDir = process.env.IMAGE_FOLDER || path.join(__dirname, 'images');
    }
    
    // If imagesDir is a network path, mount it with credentials
    if (imagesDir.startsWith('\\\\') || imagesDir.startsWith('//')) {
        try {
            const userSetting = await Sys.findOne({ where: { key: 'videopathuser' } });
            const pwSetting = await Sys.findOne({ where: { key: 'videopathpw' } });
            if (userSetting && pwSetting) {
                const videopathuser = userSetting.value;
                const videopathpw = pwSetting.value;
                exec(`net use "${imagesDir}" /user:${videopathuser} ${videopathpw}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error('Error mounting network path:', err);
                    } else {
                        console.log(`Network path mounted: ${imagesDir}`);
                    }
                });
            } else {
                console.warn('Video path credentials not found in sys table.');
            }
        } catch (err) {
            console.error('Error fetching video path credentials:', err);
        }
    }

    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    const config = mqttSetting.config;
    const brokerUrl = config["Brocker URL"];
    const options = {
        username: config["user"],
        password: config["password"]
    };

    const client = mqtt.connect(`mqtt://${brokerUrl}`, options);

    client.on('connect', () => {
        console.log('Connected to MQTT broker');
        const fullImageFile = path.join(__dirname, 'topics', 'fullimage.json');
        fs.readFile(fullImageFile, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading fullimage file ${fullImageFile}:`, err);
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
                console.error(`Error parsing JSON in file ${fullImageFile}:`, e);
            }
        });
    });

    client.on('message', (topic, message) => {
        console.log(`Received message on ${topic}`);
        try {
            const payload = JSON.parse(message.toString());
            // Assuming topic format "hazen/vistapro/<device>/fullimage"
            const tokens = topic.split('/');
            const device = tokens[2] || 'unknown';
            const { fileName, format, image } = payload; // extract image details

            // Build folder structure: imagesDir/device/YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];
            const deviceDir = path.join(imagesDir, device);
            if (!fs.existsSync(deviceDir)) {
                fs.mkdirSync(deviceDir, { recursive: true });
            }
            const dayDir = path.join(deviceDir, today);
            if (!fs.existsSync(dayDir)) {
                fs.mkdirSync(dayDir, { recursive: true });
            }
            // Build file path using fileName and format (extension) in the daily folder
            const outputFile = path.join(dayDir, `${fileName}.${format}`);
            const imageBuffer = Buffer.from(image, 'base64');
            fs.writeFile(outputFile, imageBuffer, (err) => {
                if (err) {
                    console.error('Error writing image file:', err);
                } else {
                    console.log(`Image saved to ${outputFile}`);
                    // Save record with stored image file path
                    FullImage.create({
                        device: device,
                        fileName: fileName,
                        format: format,
                        image: outputFile
                    })
                    .then(result => console.log('FullImage saved'))
                    .catch(err => console.error('Error saving FullImage:', err));
                }
            });
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });

    client.on('error', (err) => {
        console.error('MQTT client error:', err);
    });
}

startListener();
