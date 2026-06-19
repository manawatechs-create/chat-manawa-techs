const { body, query, param, validationResult } = require('express-validator');

// Middleware de validation des entrées
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Données invalides',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// Règles pour la génération de post
const postGenerationRules = [
    body('domaine')
        .isString()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Domaine invalide'),
    body('type')
        .isIn(['expertise', 'promo', 'temoignage'])
        .withMessage('Type invalide'),
    body('instructions')
        .optional()
        .isString()
        .isLength({ max: 500 })
        .withMessage('Instructions trop longues (max 500 caractères)')
];

// Règles pour les clients
const clientRules = [
    body('nom')
        .isString()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nom requis (2-100 caractères)'),
    body('telephone')
        .isString()
        .matches(/^\+?[0-9]{8,15}$/)
        .withMessage('Numéro de téléphone invalide'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Email invalide')
];

module.exports = {
    validate,
    postGenerationRules,
    clientRules
};
