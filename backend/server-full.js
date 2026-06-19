require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Services
const automationService = require('./services/automationService');
const whatsappService = require('./services/whatsappService');

// Routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const clientsRoutes = require('./routes/clients');
const crmRoutes = require('./routes/crm');
const analyticsRoutes = require('./routes/analytics');
const automationRoutes = require('./routes/automation');
const dashboardRoutes = require('./routes/dashboard');
const templatesRoutes = require('./routes/templates');
const billingRoutes = require('./routes/billing');

// Middleware
const { authenticateToken, requireRole } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;

// ============ MIDDLEWARE ============
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Session
app.use(session({
    store: new pgSession({
        conString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`
    }),
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24h
    }
}));

// Rate limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

// ============ WEBSOCKET ============
io.on('connection', (socket) => {
    console.log('🔌 Client connecté:', socket.id);
    
    socket.on('subscribe', (channel) => {
        socket.join(channel);
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client déconnecté:', socket.id);
    });
});

// Rendre io accessible aux routes
app.set('io', io);

// ============ ROUTES ============
app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'MANAWA TECHS API v2.0',
        timestamp: new Date().toISOString(),
        services: {
            whatsapp: whatsappService.isReady,
            automation: 'running',
            database: 'connected'
        }
    });
});

// Routes publiques
app.use('/api/auth', authRoutes);

// Routes protégées
app.use('/api/posts', authenticateToken, postsRoutes);
app.use('/api/clients', authenticateToken, clientsRoutes);
app.use('/api/crm', authenticateToken, crmRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/automation', authenticateToken, requireRole(['admin']), automationRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/templates', authenticateToken, templatesRoutes);
app.use('/api/billing', authenticateToken, billingRoutes);

// ============ PWA ============
app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/service-worker.js'));
});

app.get('/manifest.json', (req, res) => {
    res.json({
        name: 'MANAWA TECHS Assistant',
        short_name: 'MANAWA',
        start_url: '/',
        display: 'standalone',
        background_color: '#1E272E',
        theme_color: '#6C5CE7',
        icons: [{
            src: '/assets/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
        }, {
            src: '/assets/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
        }]
    });
});

// ============ ERREUR 404 ============
app.use('*', (req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    } else {
        res.status(404).json({ status: 'error', message: 'Route non trouvée' });
    }
});

app.use(errorHandler);

// ============ DÉMARRAGE ============
async function start() {
    try {
        // Initialiser WhatsApp (optionnel - peut être lancé séparément)
        // await whatsappService.initialize();
        
        // Démarrer l'automatisation
        automationService.startAll();
        
        server.listen(PORT, () => {
            console.log('🚀 MANAWA TECHS v2.0 démarré sur le port', PORT);
            console.log('📊 Dashboard: http://localhost:' + PORT);
            console.log('📱 API: http://localhost:' + PORT + '/api');
            console.log('🔌 WebSocket: activé');
            console.log('🤖 Automatisation: activée');
        });
    } catch (error) {
        console.error('❌ Erreur au démarrage:', error);
        process.exit(1);
    }
}

start();

module.exports = app;
