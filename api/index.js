require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============ CONFIG ============
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
const CONTACT = '+225 0797969475';
const SITE = 'https://manawatechs.web.app';

// ============ APPEL IA ============
async function callAI(message) {
    if (MISTRAL_KEY) {
        try {
            const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: `Tu es Manawa, assistant IA de MANAWA TECHS (Côte d'Ivoire). Contact: ${CONTACT}. Réponds en français avec formatage Markdown.` },
                    { role: 'user', content: message }
                ],
                temperature: 0.8, max_tokens: 2000
            }, { headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' }, timeout: 25000 });
            return res.data?.choices?.[0]?.message?.content;
        } catch(e) { return null; }
    }
    return null;
}

function localResponse(msg) {
    const m = msg.toLowerCase();
    if (/qui es/.test(m)) return `👋 **MANAWA TECHS**\n\n### 🏢 Entreprise IT ivoirienne\n📍 San-Pedro & Abidjan\n\n### ✅ Services\n🔹 Odoo ERP\n🔹 Développement Web\n🔹 Formation IT\n🔹 Cybersécurité\n\n📞 ${CONTACT}`;
    if (/salaire/.test(m)) return `💰 **SALAIRES IT CI**\n\n✅ Junior: 150k-300k FCFA\n✅ Senior: 400k-800k FCFA\n✅ Expert: 500k-1.2M FCFA\n\n📞 ${CONTACT}`;
    return `👋 **MANAWA TECHS**\n\n💬 Que voulez-vous savoir ?\n📞 ${CONTACT}`;
}

// ============ ROUTES API ============
app.post('/api/manawa/chat', async (req, res) => {
    const { message } = req.body;
    if (!message?.trim()) return res.json({ status: 'success', content: '👋 Dites-moi quelque chose !' });
    const content = await callAI(message) || localResponse(message);
    res.json({ status: 'success', content });
});

app.post('/api/manawa/post', async (req, res) => {
    const content = await callAI(`Crée un post WhatsApp sur "${req.body.sujet}". 400 mots. #ManawaTechs.`) || `📖 ${req.body.sujet}\n\n#ManawaTechs`;
    res.json({ status: 'success', content });
});

app.post('/api/manawa/image', (req, res) => {
    res.json({ status: 'success', imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}?width=1080&height=1080&nologo=true` });
});

app.get('/api/health', (req, res) => res.json({ status: 'success', deployed: true }));

app.all('*', (req, res) => res.json({ status: 'error', message: 'Route non trouvée' }));

module.exports = app;
