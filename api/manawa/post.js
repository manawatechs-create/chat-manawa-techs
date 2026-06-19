const axios = require('axios');
const MISTRAL_KEY = process.env.MISTRAL_API_KEY;

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const { sujet } = req.body;
    if (!sujet) return res.json({ content: 'Sujet requis' });
    
    if (MISTRAL_KEY) {
        try {
            const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: 'mistral-large-latest',
                messages: [{ role: 'user', content: `Crée un post WhatsApp sur "${sujet}". 400 mots. #ManawaTechs.` }],
                temperature: 0.8, max_tokens: 2000
            }, { headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 });
            return res.json({ status: 'success', content: response.data.choices[0].message.content });
        } catch(e) {
            return res.json({ status: 'success', content: `📖 ${sujet}\n\n#ManawaTechs` });
        }
    }
    return res.json({ status: 'success', content: `📖 ${sujet}\n\n#ManawaTechs` });
};
