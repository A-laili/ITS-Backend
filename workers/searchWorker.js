const { parentPort } = require('worker_threads');
const sequelize = require('../config/database');

parentPort.on('message', async ({ query, queryParams }) => {
    try {
        // Convert array params to named object parameters
        const namedParams = {};
        if (Array.isArray(queryParams)) {
            query.match(/:(\w+)/g)?.forEach((param, index) => {
                const paramName = param.substring(1); // Remove the : prefix
                namedParams[paramName] = queryParams[index];
            });
        }

        const results = await sequelize.query(query, {
            replacements: namedParams,
            type: sequelize.QueryTypes.SELECT
        });
        
        parentPort.postMessage({ 
            success: true, 
            data: results || [] 
        });
    } catch (error) {
        parentPort.postMessage({ 
            success: false, 
            error: error.message,
            query: query,
            params: queryParams
        });
    }
});
