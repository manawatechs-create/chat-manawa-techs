const rateLimit = require('express-rate-limit');

// Limiteur général
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        status: 'error',
        message: 'Trop de requêtes. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiteur strict pour les routes sensibles
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 heure
    max: 5,
    message: {
        status: 'error',
        message: 'Trop de tentatives. Compte bloqué pour 1 heure.'
    }
});

// Limiteur pour les API keys
const apiKeyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: {
        status: 'error',
        message: 'Limite de requêtes API dépassée.'
    }
});

module.exports = { generalLimiter, authLimiter, apiKeyLimiter };
