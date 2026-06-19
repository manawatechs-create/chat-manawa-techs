require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// API simples qui marchent
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/dashboard', async (req, res) => {
    try {
        const posts = await db('posts').count().first();
        const clients = await db('clients').count().first();
        res.json({
            status: 'success',
            data: {
                total_posts: parseInt(posts?.count || 0),
                total_clients: parseInt(clients?.count || 0),
                total_messages: 0,
                recent_posts: []
            }
        });
    } catch(e) {
        res.json({ status: 'success', data: { total_posts: 0, total_clients: 0, total_messages: 0 } });
    }
});

app.post('/api/posts/generate', async (req, res) => {
    const { domaine } = req.body;
    const posts = {
        odoo: `💼 Votre entreprise utilise encore Excel pour tout gérer ?\n\nAvec Odoo ERP, centralisez stocks, ventes et compta en un seul outil. Gain de temps garanti !\n\n👉 Intéressé ? Contactez MANAWA TECHS\n📞 +225 0797969475`,
        web: `🌐 Votre entreprise n'a pas encore de site web pro ?\n\nEn 2026, vos clients vous cherchent sur internet. Ne passez pas à côté !\n\n✨ Site vitrine, e-commerce, application web...\n📞 +225 0797969475`,
        ia: `🤖 L'IA n'est plus réservée aux grandes entreprises !\n\nAutomatisez vos tâches et boostez votre productivité avec l'Intelligence Artificielle.\n\n🎓 Formation disponible\n📞 +225 0797969475`,
        formation: `🎓 Boostez votre carrière avec nos formations IT !\n\n✅ Bureautique | ✅ Programmation\n✅ Réseaux | ✅ Sécurité | ✅ IA\n\n📍 San-Pedro & Abidjan\n📞 +225 0797969475`,
        securite: `🔒 Protégez votre entreprise contre les cyberattaques !\n\n3 conseils essentiels :\n1️⃣ Mots de passe robustes\n2️⃣ Mises à jour régulières\n3️⃣ Sauvegardes automatiques\n\n📞 +225 0797969475`,
        imprimerie: `🖨️ Besoin de bâches, flyers ou vinyles ?\n\nMANAWA TECHS fait aussi de l'imprimerie numérique de qualité !\n\n🎨 Design pro | ⚡ Rapide | 💰 Prix compétitifs\n📞 +225 0797969475`,
        linux: `🐧 Pourquoi migrer vers Linux ?\n\n✅ Plus sécurisé | ✅ Gratuit | ✅ Stable\n✅ Personnalisable\n\nOn vous accompagne ! 📞 +225 0797969475`
    };
    
    const contenu = posts[domaine] || `💡 MANAWA TECHS - Expert IT en Côte d'Ivoire\n\nVotre partenaire digital à San-Pedro & Abidjan\n📞 +225 0797969475`;
    
    res.json({ status: 'success', data: { content: contenu, domain: domaine } });
});

app.post('/api/posts/generate-image', (req, res) => {
    const { theme } = req.body;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(`MANAWA TECHS ${theme} professional`)}?width=1024&height=1024&nologo=true`;
    res.json({ status: 'success', data: { imageUrl: url } });
});

app.get('/api/clients', async (req, res) => {
    try {
        const clients = await db('clients').limit(20);
        res.json({ status: 'success', data: clients });
    } catch(e) {
        res.json({ status: 'success', data: [] });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const { nom, prenom, telephone, type_client } = req.body;
        await db('clients').insert({
            first_name: prenom || '',
            last_name: nom || '',
            phone: telephone || '',
            type: type_client || 'prospect',
            status: 'prospect'
        });
        res.json({ status: 'success', message: 'Client ajouté' });
    } catch(e) {
        res.json({ status: 'error', message: e.message });
    }
});

// Servir l'interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`\n✅ SERVEUR DÉMARRÉ: http://localhost:${PORT}\n`);
});
