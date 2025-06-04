require('dotenv').config();
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const IntegrationSettings = require('../models/IntegrationSettings');
const CropImage = require('./hazen_models/CropImage');
const GeneralSettings = require('../models/GeneralSettings');
const Sys = require('../models/sys');
const { exec } = require('child_process');
const eventBroker = require('../services/eventBroker'); // Added: require eventBroker

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

	// Retrieve image folder from GeneralSettings
	let imagesDir;
	try {
		const setting = await GeneralSettings.findOne({ order: [['createdAt', 'DESC']] });
		imagesDir = setting ? setting.imagePath : process.env.IMAGE_FOLDER || path.join(__dirname, 'images');
	} catch (err) {
		console.error('Error fetching GeneralSettings:', err);
		imagesDir = process.env.IMAGE_FOLDER || path.join(__dirname, 'images');
	}
	
	// Mount network path if needed
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
		const cropFile = path.join(__dirname, 'topics', 'cropimage.json');
		fs.readFile(cropFile, 'utf8', (err, data) => {
			if (err) {
				console.error(`Error reading crop file ${cropFile}:`, err);
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
				console.error(`Error parsing JSON in file ${cropFile}:`, e);
			}
		});
	});

	client.on('message', (topic, message) => {
		console.log(`Received message on ${topic}`);
		try {
			const payload = JSON.parse(message.toString());
			const tokens = topic.split('/');
			const device = tokens[2] || 'unknown';
			const { fileName, format, image } = payload;

			// Build folder structure: imagesDir/device/YYYY-MM-DD/crop
			const today = new Date().toISOString().split('T')[0];
			const deviceDir = path.join(imagesDir, device);
			if (!fs.existsSync(deviceDir)) {
				fs.mkdirSync(deviceDir, { recursive: true });
			}
			const dayDir = path.join(deviceDir, today, 'crop');
			if (!fs.existsSync(dayDir)) {
				fs.mkdirSync(dayDir, { recursive: true });
			}

			const outputFile = path.join(dayDir, `${fileName}.${format}`);
			const imageBuffer = Buffer.from(image, 'base64');
			fs.writeFile(outputFile, imageBuffer, (err) => {
				if (err) {
					console.error('Error writing image file:', err);
				} else {
					console.log(`Crop image saved to ${outputFile}`);

					// Prepare event data for broker
					const eventData = {
						device: device,
						fileName: fileName,
						format: format,
						imagePath: outputFile,
						timestamp: new Date().toISOString()
					};

					// Publish to event broker
					console.log('[CROP] Publishing to event broker:', eventData);
					eventBroker.publish('CROP', eventData);
					console.log('[CROP] Published to event broker');

					// Save record with stored image file path
					CropImage.create({
						device: device,
						fileName: fileName,
						format: format,
						image: outputFile
					})
					.then(result => console.log('CropImage saved:', result.id))
					.catch(err => console.error('Error saving CropImage:', err));
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
