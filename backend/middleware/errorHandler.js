const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.message);
    
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ status: 'error', message: 'JSON invalide' });
    }

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
