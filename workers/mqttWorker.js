const { parentPort } = require('worker_threads');
const IntegrationSettings = require('../models/IntegrationSettings');
const Status = require('../Hazen/hazen_models/Status');
const Alpr = require('../Hazen/hazen_models/Alpr');
const Violation = require('../Hazen/hazen_models/Violation');
const CropImage = require('../Hazen/hazen_models/CropImage');
const FullImage = require('../Hazen/hazen_models/FullImage');
const GeneralSettings = require('../models/GeneralSettings');
const PV_violation = require('../models/PV_violation');
const fs = require('fs').promises;
const path = require('path');

async function processMessage(type, topic, message) {
    try {
        const payload = JSON.parse(message);
        if (!payload) throw new Error('Empty payload received');

        const tokens = topic.split('/');
        const device = tokens[2] || 'unknown';
        let result;

        switch (type) {
            case 'status':
                result = await Status.create({
                    device,
                    status: payload.status || 'unknown'
                });
                break;

            case 'alpr':
                // Map payload into Alpr model fields
                const alprData = {
                    device: device,
                    direction: payload.direction,
                    eventId: payload.eventId,
                    fullImageFileName: payload.fullImageFileName,
                    lpVisible: payload.lpVisible,
                    sitename: payload.sitename,
                    speedmph: payload.speedmph,
                    timestampUnixMs: payload.timestampUnixMs,
                    lp_country: payload.lpData?.country,
                    lp_countryConfidence: payload.lpData?.countryConfidence,
                    lp_lpCropImage: payload.lpData?.lpCropImage,
                    lp_lpOcr: payload.lpData?.lpOcr,
                    lp_lpOcrConfidence: payload.lpData?.lpOcrConfidence,
                    lp_plateCategory: payload.lpData?.plateCategory,
                    lp_plateCategoryConf: payload.lpData?.plateCategoryConf,
                    vehicle_color: payload.vehicleData?.color,
                    vehicle_colorConfidence: payload.vehicleData?.colorConfidence,
                    vehicle_lpBb_BbConf: payload.vehicleData?.lpBb?.BbConf,
                    vehicle_lpBb_h: payload.vehicleData?.lpBb?.h,
                    vehicle_lpBb_w: payload.vehicleData?.lpBb?.w,
                    vehicle_lpBb_x: payload.vehicleData?.lpBb?.x,
                    vehicle_lpBb_y: payload.vehicleData?.lpBb?.y,
                    vehicle_make: payload.vehicleData?.make,
                    vehicle_makeConfidence: payload.vehicleData?.makeConfidence,
                    vehicle_model: payload.vehicleData?.model,
                    vehicle_modelConfidence: payload.vehicleData?.modelConfidence,
                    vehicle_vechicleBb_BbConf: payload.vehicleData?.vechicleBb?.BbConf,
                    vehicle_vechicleBb_h: payload.vehicleData?.vechicleBb?.h,
                    vehicle_vechicleBb_w: payload.vehicleData?.vechicleBb?.w,
                    vehicle_vechicleBb_x: payload.vehicleData?.vechicleBb?.x,
                    vehicle_vechicleBb_y: payload.vehicleData?.vechicleBb?.y,
                    vehicle_vehicleImageFileName: payload.vehicleData?.vehicleImageFileName,
                    vehicle_vehicleType: payload.vehicleData?.vehicleType,
                    vehicle_vehicleTypeConf: payload.vehicleData?.vehicleTypeConf
                };

                // Prepare event data for broker with debug logging
                const eventData = {
                    type: 'ALPR',
                    data: {
                        eventType: 'ALPR',
                        plateNumber: payload.lpData?.lpOcr || 'Unknown',
                        confidence: payload.lpData?.lpOcrConfidence || 0,
                        timestamp: new Date(payload.timestampUnixMs).toISOString(),
                        imageUrl: payload.vehicleData?.vehicleImageFileName,
                        device: device,
                        speed: payload.speedmph,
                        direction: payload.direction,
                        sitename: payload.sitename,
                        make: payload.vehicleData?.make,
                        model: payload.vehicleData?.model,
                        color: payload.vehicleData?.color,
                        vehicleType: payload.vehicleData?.vehicleType
                    }
                };

                // Send to parent (mqtt-cluster)
                parentPort.postMessage({
                    success: true,
                    type: 'broadcast',
                    data: eventData
                });

                // Save to database after broadcasting
                result = await Alpr.create(alprData);
                break;

            case 'violation':
                {
                    // Extract violation record data from nested structure
                    const alprData = payload.alprData || {};
                    const violationRecord = {
                        device: device,
                        eventId: payload.eventId,
                        sitename: payload.sitename,
                        timestampUnixMs: payload.timestampUnixMs,
                        direction: alprData.direction,
                        lpVisible: alprData.lpVisible,
                        speedmph: alprData.speedmph,
                        lp_country: alprData.lpData?.country,
                        lp_countryConfidence: alprData.lpData?.countryConfidence,
                        lp_lpCropImage: alprData.lpData?.lpCropImage,
                        lp_lpOcr: alprData.lpData?.lpOcr,
                        lp_lpOcrConfidence: alprData.lpData?.lpOcrConfidence,
                        lp_plateCategory: alprData.lpData?.plateCategory,
                        lp_plateCategoryConf: alprData.lpData?.plateCategoryConf,
                        vehicle_color: alprData.vehicleData?.color,
                        vehicle_colorConfidence: alprData.vehicleData?.colorConfidence,
                        vehicle_lpBb_BbConf: alprData.vehicleData?.lpBb?.BbConf,
                        vehicle_lpBb_h: alprData.vehicleData?.lpBb?.h,
                        vehicle_lpBb_w: alprData.vehicleData?.lpBb?.w,
                        vehicle_lpBb_x: alprData.vehicleData?.lpBb?.x,
                        vehicle_lpBb_y: alprData.vehicleData?.lpBb?.y,
                        vehicle_make: alprData.vehicleData?.make,
                        vehicle_makeConfidence: alprData.vehicleData?.makeConfidence,
                        vehicle_model: alprData.vehicleData?.model,
                        vehicle_modelConfidence: alprData.vehicleData?.modelConfidence,
                        vehicle_vechicleBb_BbConf: alprData.vehicleData?.vechicleBb?.BbConf,
                        vehicle_vechicleBb_h: alprData.vehicleData?.vechicleBb?.h,
                        vehicle_vechicleBb_w: alprData.vehicleData?.vechicleBb?.w,
                        vehicle_vechicleBb_x: alprData.vehicleData?.vechicleBb?.x,
                        vehicle_vechicleBb_y: alprData.vehicleData?.vechicleBb?.y,
                        vehicle_vehicleImageFileName: alprData.vehicleData?.vehicleImageFileName,
                        vehicle_vehicleType: alprData.vehicleData?.vehicleType,
                        vehicle_vehicleTypeConf: alprData.vehicleData?.vehicleTypeConf,
                        violation_Bb_h: payload.violationData?.bb[0],
                        violation_Bb_w: payload.violationData?.bb[1],
                        violation_Bb_x: payload.violationData?.bb[2],
                        violation_Bb_y: payload.violationData?.bb[3],
                        violation_cShotImageFileName: payload.violationData?.cShotImageFileName,
                        violation_type: payload.violationData?.type,
                        violation_violationVideoURI: payload.violationData?.violationVideoURI
                    };

                    // Prepare event data for broadcasting
                    const eventData = {
                        type: 'VIOLATION',
                        data: {
                            eventType: 'VIOLATION',
                            plateNumber: alprData.lpData?.lpOcr || 'Unknown',
                            violation: payload.violationData?.type,
                            confidence: alprData.lpData?.lpOcrConfidence || 0,
                            timestamp: new Date(payload.timestampUnixMs).toISOString(),
                            imageUrl: alprData.vehicleData?.vehicleImageFileName,
                            device: device,
                            speed: alprData.speedmph,
                            direction: alprData.direction,
                            sitename: payload.sitename,
                            make: alprData.vehicleData?.make,
                            model: alprData.vehicleData?.model,
                            color: alprData.vehicleData?.color,
                            vehicleType: alprData.vehicleData?.vehicleType
                        }
                    };

                    parentPort.postMessage({
                        success: true,
                        type: 'broadcast',
                        data: eventData
                    });

                    result = await Violation.create(violationRecord);

                    // Create PV_violation record
                    const pvViolationData = {
                        violationId: result.id, // Assuming Violation.create returns the created object with an 'id'
                        violationTime: new Date(payload.timestampUnixMs).toISOString(),
                        sitename: payload.sitename,
                        violationType: payload.violationData?.type,
                        status: 'pending', // Default status
                        notification: false, // Default notification
                        userId: 1, // Default user ID

                        // Map other relevant fields from violationRecord to PV_violation
                    };

                    await PV_violation.create(pvViolationData);
                }
                break;

            case 'cropimage':
            case 'fullimage':
                // Get image storage path from settings
                const setting = await GeneralSettings.findOne({
                    order: [['createdAt', 'DESC']]
                });
                const imagesDir = setting?.imagePath || path.join(__dirname, '../images');

                // Build folder structure: imagesDir/device/YYYY-MM-DD
                const today = new Date().toISOString().split('T')[0];
                const deviceDir = path.join(imagesDir, device);
                await fs.mkdir(deviceDir, { recursive: true });

                const dayDir = path.join(deviceDir, today);
                await fs.mkdir(dayDir, { recursive: true });

                if (type === 'cropimage') {
                    await fs.mkdir(path.join(dayDir, 'crop'), { recursive: true });
                }

                const outputPath = type === 'cropimage' ?
                    path.join(dayDir, 'crop', `${payload.fileName}.${payload.format}`) :
                    path.join(dayDir, `${payload.fileName}.${payload.format}`);

                // Save image file
                await fs.writeFile(outputPath, Buffer.from(payload.image, 'base64'));

                // Fixed: Create database record with correct model selection
                const Model = type === 'cropimage' ? CropImage : FullImage;
                result = await Model.create({
                    device,
                    fileName: payload.fileName,
                    format: payload.format,
                    image: outputPath
                });
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        parentPort.postMessage({
            success: true,
            type,
            data: result
        });

    } catch (error) {
        parentPort.postMessage({
            success: false,
            type,
            error: error.message
        });
    }
}

// Handle messages from parent
parentPort.on('message', async ({ type, topic, message }) => {
    await processMessage(type, topic, message);
});

// Handle worker errors
process.on('uncaughtException', (error) => {
    parentPort.postMessage({
        success: false,
        type: 'error',
        error: error.message
    });
});
