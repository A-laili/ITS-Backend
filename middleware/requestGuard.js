const requestCache = new Map();
const CACHE_TTL = 1000; // 1 second

function generateRequestKey(req) {
    return `${req.method}-${req.originalUrl}-${req.ip}-${JSON.stringify(req.body)}`;
}

function cleanupCache() {
    const now = Date.now();
    for (const [key, timestamp] of requestCache) {
        if (now - timestamp > CACHE_TTL) {
            requestCache.delete(key);
        }
    }
}

module.exports = function requestGuard(req, res, next) {
    const requestKey = generateRequestKey(req);
    const now = Date.now();

    if (requestCache.has(requestKey)) {
        const timestamp = requestCache.get(requestKey);
        if (now - timestamp < CACHE_TTL) {
            return res.status(429).json({ 
                error: 'Duplicate request detected. Please wait before retrying.' 
            });
        }
    }

    requestCache.set(requestKey, now);
    cleanupCache();
    next();
};
