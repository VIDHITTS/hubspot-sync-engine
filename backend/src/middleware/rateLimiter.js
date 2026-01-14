const requestCounts = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.windowStart > 120000) {
            requestCounts.delete(key);
        }
    }
}, 300000);

const createRateLimiter = (options = {}) => {
    const {
        windowMs = 60000,
        max = 100,
        message = "Too many requests, please try again later.",
    } = options;

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress || "unknown";
        const now = Date.now();

        let record = requestCounts.get(key);

        if (!record || now - record.windowStart >= windowMs) {
            record = { count: 1, windowStart: now };
            requestCounts.set(key, record);
        } else {
            record.count++;
        }

        res.set({
            "X-RateLimit-Limit": max,
            "X-RateLimit-Remaining": Math.max(0, max - record.count),
            "X-RateLimit-Reset": Math.ceil((record.windowStart + windowMs) / 1000),
        });

        if (record.count > max) {
            const retryAfter = Math.ceil((record.windowStart + windowMs - now) / 1000);
            res.set("Retry-After", retryAfter);
            return res.status(429).json({
                error: message,
                retryAfter,
            });
        }

        next();
    };
};

const apiLimiter = createRateLimiter({
    windowMs: 60000,
    max: 100,
    message: "Too many API requests, please try again later.",
});

const webhookLimiter = createRateLimiter({
    windowMs: 60000,
    max: 500,
    message: "Too many webhook requests.",
});

const strictLimiter = createRateLimiter({
    windowMs: 60000,
    max: 30,
    message: "Rate limit exceeded for this operation.",
});

module.exports = {
    createRateLimiter,
    apiLimiter,
    webhookLimiter,
    strictLimiter,
};
