const express = require('express');
const app = express();
app.use(express.json());

console.log('📱 API WhatsApp MANAWA TECHS');
console.log('================================');
console.log('');
console.log('💡 POUR ENVOYER SUR WHATSAPP :');
console.log('');
console.log('Option 1 - WhatsApp Web (gratuit) :');
console.log('  Le message s\'ouvre dans WhatsApp Web');
console.log('  Collez et envoyez manuellement');
console.log('');
console.log('Option 2 - Application WhatsApp Desktop :');
console.log('  Installez WhatsApp Desktop depuis le Microsoft Store');
console.log('  Les liens whatsapp:// s\'ouvriront directement');
console.log('');
console.log('Option 3 - WhatsApp Cloud API (payant) :');
console.log('  https://business.whatsapp.com/');
console.log('');
console.log('API démarrée sur http://localhost:3001');
console.log('================================\n');

// Route pour générer le lien WhatsApp
app.post('/send', (req, res) => {
    const { message, phone } = req.body;
    
    // Nettoyer le numéro
    const cleanPhone = (phone || '2250797969475').replace(/[^0-9]/g, '');
    
    // Créer le lien WhatsApp
    const encodedMessage = encodeURIComponent(message);
    
    // Plusieurs options
    const links = {
        // WhatsApp Web (fonctionne dans le navigateur)
        web: `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`,
        
        // WhatsApp Desktop (si installé)
        desktop: `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`,
        
        // API directe (pour usage manuel)
        api: `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`
    };
    
    res.json({
        status: 'success',
        message: 'Liens WhatsApp générés',
        links: links,
        phone: cleanPhone,
        text: message
    });
});

// Route pour envoyer via l'API WhatsApp Cloud (si configurée)
app.post('/cloud-send', async (req, res) => {
    const { message, to } = req.body;
    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    
    if (!token || !phoneId) {
        return res.status(400).json({
            status: 'error',
            message: 'WhatsApp Cloud API non configurée. Configurez WHATSAPP_CLOUD_TOKEN et WHATSAPP_PHONE_ID dans .env'
        });
    }
    
    try {
        const axios = require('axios');
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${phoneId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({ status: 'success', data: response.data });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Statut
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        methods: {
            web: 'WhatsApp Web (gratuit, ouvre dans navigateur)',
            desktop: 'WhatsApp Desktop (si installé)',
            cloud: process.env.WHATSAPP_CLOUD_TOKEN ? 'Configuré' : 'Non configuré'
        }
    });
});

app.listen(3001, () => {
    console.log('✅ API WhatsApp prête sur http://localhost:3001');
});
