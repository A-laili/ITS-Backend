const logger = require('../utils/logger');
const genetecMapping = require('../config/genetecMapping.json');

class FieldMapperService {
    constructor(mapping = genetecMapping) {
        this.mapping = mapping;
    }

    mapFields(sourceData) {
        try {
            const result = {};
            const { fields, defaults } = this.mapping;

            // Apply mapped fields
            for (const [targetField, sourceField] of Object.entries(fields)) {
                if (typeof sourceField === 'string') {
                    result[targetField] = sourceData[sourceField];
                } else if (typeof sourceField === 'object') {
                    // Handle complex mappings (e.g., status with value mapping)
                    if (sourceField.values) {
                        const sourceValue = sourceData[sourceField.field];
                        result[targetField] = sourceField.values[sourceValue] || defaults[targetField];
                    } else {
                        // Handle nested metadata fields
                        result[targetField] = {};
                        for (const [metaKey, metaField] of Object.entries(sourceField)) {
                            result[targetField][metaKey] = sourceData[metaField];
                        }
                    }
                }
            }

            // Apply defaults for missing fields
            for (const [field, value] of Object.entries(defaults)) {
                if (result[field] === undefined) {
                    result[field] = value;
                }
            }

            return result;
        } catch (error) {
            logger.error('Field mapping error:', error);
            throw new Error(`Field mapping failed: ${error.message}`);
        }
    }
}

module.exports = new FieldMapperService();
