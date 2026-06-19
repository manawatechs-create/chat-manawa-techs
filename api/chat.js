const axios = require('axios');

const MISTRAL_KEY = process.env.MISTRAL_API_KEY || 'kH9feAqoKiauc4Pg05KozG0YD1lxMVvn';
const CONTACT = '+225 0797969475';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method === 'GET') return res.json({ status: 'ok' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { message, sujet } = req.body;
    const userMessage = message || sujet;
    
    if (!userMessage?.trim()) return res.json({ content: '👋 Dites-moi quelque chose !' });
    
    // Construire le prompt
    let prompt = userMessage;
    if (sujet && !message) {
        prompt = `Crée un post WhatsApp éducatif sur "${sujet}". 400 mots. #ManawaTechs.`;
    }
    
    // Appeler Mistral
    try {
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages: [
                { 
                    role: 'system', 
                    content: `Tu es Manawa, assistant IA de MANAWA TECHS (Côte d'Ivoire, San-Pedro & Abidjan). 
Contact: ${CONTACT}. 
Réponds TOUJOURS en français.
Sois utile, dynamique et complet.
Adapte ta réponse à la question posée.
Si on te demande des idées, propose des idées concrètes.
Si on te demande un post, crée un post structuré.
Si on te demande un cours, donne un cours détaillé.` 
                },
                { role: 'user', content: prompt }
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
        
        const content = response.data?.choices?.[0]?.message?.content;
        if (content) {
            return res.json({ status: 'success', content });
        }
    } catch(e) {
        console.log('Mistral error:', e.message);
    }
    
    // Fallback local intelligent
    const msg = userMessage.toLowerCase();
    let reply;
    
    if (msg.includes('idée') || msg.includes('propose')) {
        reply = `💡 **IDÉES DE CONTENU POUR VOTRE CHAÎNE**\n\n📅 **Lundi** 🟢\n"Les bases de l'informatique expliquées simplement"\n\n📅 **Mardi** 🟡\n"Excel : 5 astuces qui changent tout"\n\n📅 **Mercredi** 🟢\n"Internet : comment ça marche ?"\n\n📅 **Jeudi** 🔴\n"Cybersécurité : protégez votre entreprise"\n\n📅 **Vendredi** 🎓\n"Les compétences IT qui paient le plus"\n\n📞 **${CONTACT}**`;
    } else if (msg.includes('post') || msg.includes('crée') || msg.includes('excel')) {
        reply = `📊 **POST SUR EXCEL**\n\n### 🎯 Le concept\nExcel est l'outil indispensable pour gérer vos données.\n\n### 📋 Astuce du jour\n✅ Utilisez les tableaux croisés dynamiques\n✅ Maîtrisez les formules RECHERCHEV\n✅ Automatisez avec les macros\n\n### 💡 Conseil MANAWA\nFormez-vous pour devenir un expert Excel !\n\n📞 **${CONTACT}**`;
    } else if (msg.includes('qui es') || msg.includes('bonjour') || msg.includes('salut')) {
        reply = `👋 **JE SUIS MANAWA !**\n\nAssistant IA de **MANAWA TECHS**, entreprise IT ivoirienne.\n\n### ✅ Ce que je peux faire\n🔹 Créer des posts WhatsApp\n🔹 Proposer des idées de contenu\n🔹 Expliquer des concepts tech\n🔹 Donner des cours détaillés\n\n📞 **${CONTACT}**`;
    } else {
        reply = `👋 **MANAWA TECHS**\n\n### 💬 Je peux vous aider avec :\n✅ Des idées de contenu\n✅ Des posts WhatsApp\n✅ Des explications techniques\n✅ Des cours complets\n\n📞 **${CONTACT}**`;
    }
    
    return res.json({ status: 'success', content: reply });
};
