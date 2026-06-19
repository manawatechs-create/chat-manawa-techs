const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const { message } = req.body || {};
    if (!message?.trim()) return res.json({ content: '👋 Dites-moi quelque chose !' });
    
    const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
    console.log('Mistral key present:', !!MISTRAL_KEY);
    
    if (!MISTRAL_KEY) {
        return res.json({ content: '⚠️ Clé API non configurée. Ajoutez MISTRAL_API_KEY dans les variables d\'environnement Vercel.' });
    }
    
    try {
        const resp = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages: [
                { 
                    role: 'system', 
                    content: 'Tu es Manawa, assistant IA de MANAWA TECHS (Côte d\'Ivoire, San-Pedro & Abidjan). Contact: +225 0797969475. Réponds TOUJOURS en français. Sois dynamique, utile et complet. Adapte ta réponse à chaque question.' 
                },
                { role: 'user', content: message }
            ],
            temperature: 0.8,
            max_tokens: 2000
        }, {
            headers: { 
                'Authorization': `Bearer ${MISTRAL_KEY}`, 
                'Content-Type': 'application/json' 
            },
            timeout: 25000
        });
        
        const content = resp.data?.choices?.[0]?.message?.content;
        if (content) {
            return res.json({ status: 'success', content });
        }
    } catch(e) {
        console.error('Mistral error:', e.response?.status, e.message);
    }
    
    return res.json({ content: '❌ Erreur de connexion à l\'IA. Vérifiez votre clé API.' });
};
