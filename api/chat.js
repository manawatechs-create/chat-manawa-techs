const axios = require('axios');
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
const CONTACT = '+225 0797969475';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    
    const { message } = req.body;
    if (!message?.trim()) return res.json({ content: '👋 Dites-moi quelque chose !' });
    
    // Appeler Mistral
    if (MISTRAL_KEY) {
        try {
            const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: `Tu es Manawa, assistant IA de MANAWA TECHS (Côte d'Ivoire). Contact: ${CONTACT}. Réponds en français.` },
                    { role: 'user', content: message }
                ],
                temperature: 0.8, max_tokens: 2000
            }, { headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 });
            
            return res.json({ status: 'success', content: response.data.choices[0].message.content });
        } catch(e) {
            return res.json({ status: 'success', content: localResponse(message) });
        }
    }
    
    return res.json({ status: 'success', content: localResponse(message) });
};

function localResponse(msg) {
    const m = msg.toLowerCase();
    if (/qui es/.test(m)) return `👋 **MANAWA TECHS**\n\nEntreprise IT ivoirienne\n📍 San-Pedro & Abidjan\n📞 ${CONTACT}`;
    if (/salaire/.test(m)) return `💰 **SALAIRES IT CI**\n✅ Junior: 150k-300k\n✅ Senior: 400k-800k\n✅ Expert: 500k-1.2M\n📞 ${CONTACT}`;
    return `👋 **MANAWA TECHS**\n💬 Que voulez-vous savoir ?\n📞 ${CONTACT}`;
}
