const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        // En développement, créer un utilisateur par défaut
        if (process.env.NODE_ENV === 'development') {
            req.user = { id: 1, role: 1 };
            return next();
        }
        return res.status(401).json({ status: 'error', message: 'Token manquant' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ status: 'error', message: 'Token invalide' });
    }
};

// Middleware de rôles
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Non authentifié' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Accès non autorisé' });
        }
        
        next();
    };
};

module.exports = { authenticateToken, requireRole };
