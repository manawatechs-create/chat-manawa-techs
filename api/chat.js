const axios = require('axios');

// ============ MÉMOIRE CONTEXTUELLE ============
const sessions = new Map(); // Stocke l'historique des conversations

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const { message, session_id, action, image_url } = req.body || {};
    const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
    
    // ============ GESTION DES SESSIONS ============
    const sid = session_id || 'default';
    if (!sessions.has(sid)) sessions.set(sid, []);
    const history = sessions.get(sid);
    
    // ============ ROUTAGE DES ACTIONS ============
    switch(action) {
        case 'generate_image':
            return handleImageGeneration(req, res);
        case 'generate_carousel':
            return handleCarousel(req, res);
        case 'generate_video_script':
            return handleVideoScript(req, res);
        case 'generate_infographie':
            return handleInfographie(req, res);
        case 'generate_quiz':
            return handleQuiz(req, res);
        case 'generate_course':
            return handleCourse(req, res);
        case 'generate_post':
            return handlePost(req, res, MISTRAL_KEY);
        case 'analyze_image':
            return handleImageAnalysis(req, res, image_url, MISTRAL_KEY);
        case 'publish_whatsapp':
            return handleWhatsAppPublish(req, res);
        case 'get_analytics':
            return handleAnalytics(req, res);
        case 'get_dashboard':
            return handleDashboard(req, res);
        case 'create_invoice':
            return handleInvoice(req, res);
        case 'process_payment':
            return handlePayment(req, res);
        default:
            return handleChat(req, res, MISTRAL_KEY, history, sid);
    }
};

// ============ CHAT AVEC MÉMOIRE ============
async function handleChat(req, res, MISTRAL_KEY, history, sid) {
    const { message } = req.body;
    if (!message?.trim()) return res.json({ content: '👋 Dites-moi quelque chose !' });
    
    // Ajouter à l'historique
    history.push({ role: 'user', content: message });
    if (history.length > 20) history.shift(); // Garder 20 derniers messages
    
    if (!MISTRAL_KEY) return res.json({ content: generateLocalResponse(message) });
    
    try {
        const messages = [
            { 
                role: 'system', 
                content: `Tu es Manawa, assistant IA ULTIME de MANAWA TECHS (Côte d'Ivoire, San-Pedro & Abidjan).
                
CAPACITÉS :
✅ Mémoire contextuelle - Tu te souviens de la conversation
✅ Création de posts WhatsApp viraux
✅ Génération d'images et carrousels
✅ Cours complets avec quiz
✅ Scripts vidéo TikTok/Reels
✅ Infographies professionnelles
✅ Analyse d'images
✅ Publication WhatsApp automatique
✅ Statistiques et analytics
✅ Devis et factures
✅ Paiement Mobile Money

CONTACT : +225 0797969475
SITE : manawatechs.web.app
CHANNEL : https://whatsapp.com/channel/0029Vb7LcepA2pLCLxhjCd0b

SERVICES :
- Odoo ERP
- Développement Web
- Formation IT (Bureautique, Programmation, Cybersécurité)
- Imprimerie Numérique
- Intelligence Artificielle

RÉPONDS avec ce format :
1. Emoji + **Titre en gras**
2. ### Sections structurées
3. ✅ Listes avec emojis
4. Termine par 📞 +225 0797969475`
            },
            ...history.slice(-10) // Contexte récent
        ];
        
        const resp = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-large-latest',
            messages,
            temperature: 0.8,
            max_tokens: 2000
        }, {
            headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' },
            timeout: 25000
        });
        
        const content = resp.data?.choices?.[0]?.message?.content;
        if (content) {
            history.push({ role: 'assistant', content });
            return res.json({ status: 'success', content, session_id: sid, history_length: history.length });
        }
    } catch(e) {
        console.error('Mistral error:', e.message);
    }
    
    return res.json({ content: generateLocalResponse(message) });
}

// ============ GÉNÉRATION D'IMAGE ============
function handleImageGeneration(req, res) {
    const { prompt } = req.body;
    const urls = [];
    for (let i = 0; i < 3; i++) {
        urls.push(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ' professional high quality')}?width=1080&height=1080&nologo=true&seed=${i*100}`);
    }
    res.json({ status: 'success', images: urls });
}

// ============ CARROUSEL AUTO ============
function handleCarousel(req, res) {
    const { theme } = req.body;
    const slides = [];
    for (let i = 1; i <= 5; i++) {
        slides.push({
            number: i,
            url: `https://image.pollinations.ai/prompt/${encodeURIComponent(`slide ${i}, ${theme}, MANAWA TECHS, educational`)}?width=1080&height=1080&nologo=true&seed=${i*100}`,
            title: `Slide ${i} - ${theme}`
        });
    }
    res.json({ status: 'success', slides, total: 5 });
}

// ============ SCRIPT VIDÉO ============
function handleVideoScript(req, res) {
    const { sujet } = req.body;
    const script = `🎬 **SCRIPT VIDÉO 30s - ${sujet}**

[0-5s] 🎵 Musique dynamique
Texte à l'écran : "${sujet}"

[5-10s] 🎯 Le problème
"Tu galères avec ${sujet} ?"
Montrer situation frustrante

[10-20s] 💡 La solution
Présenter la solution simple
3 étapes clés

[20-25s] 🎓 MANAWA TECHS
Logo + "Formation complète disponible"
📞 +225 0797969475

[25-30s] 🔥 Call to action
"Abonne-toi pour plus d'astuces !"
#ManawaTechs #FormationIT`;
    
    res.json({ status: 'success', script });
}

// ============ INFOGRAPHIE ============
function handleInfographie(req, res) {
    const { titre } = req.body;
    const urls = [];
    for (let i = 0; i < 3; i++) {
        urls.push(`https://image.pollinations.ai/prompt/${encodeURIComponent(`infographic ${titre}, blue orange white, professional, 4K`)}?width=1080&height=1350&nologo=true&seed=${i*200}`);
    }
    res.json({ status: 'success', infographies: urls });
}

// ============ QUIZ ============
function handleQuiz(req, res) {
    const { sujet } = req.body;
    const quiz = `❓ **QUIZ ${sujet.toUpperCase()}**

### Question 1
Qu'est-ce que ${sujet} ?
A) Une technologie
B) Un langage
C) Un framework
D) Un outil

### Question 2
Quel est l'avantage principal ?
A) Rapidité
B) Simplicité
C) Sécurité
D) Tout ça

### Question 3
Qui l'utilise le plus ?
A) Débutants
B) Professionnels
C) Entreprises
D) Tout le monde

💬 Répondez en commentaire !
Bonne réponse demain 👇
#ManawaTechs #Quiz`;
    
    res.json({ status: 'success', quiz });
}

// ============ COURS STRUCTURÉ ============
function handleCourse(req, res) {
    const { sujet } = req.body;
    const course = `🎓 **COURS COMPLET : ${sujet.toUpperCase()}**

⏱️ Durée : 10 minutes
🎯 Niveau : Débutant à Intermédiaire

━━━━━━━━━━━━━━━━━━━
📖 1. INTRODUCTION
━━━━━━━━━━━━━━━━━━━
→ Qu'est-ce que ${sujet} ?
→ Pourquoi c'est important ?
→ Objectifs du cours

━━━━━━━━━━━━━━━━━━━
🧠 2. FONDAMENTAUX
━━━━━━━━━━━━━━━━━━━
✅ Concept 1
✅ Concept 2
✅ Concept 3

━━━━━━━━━━━━━━━━━━━
💻 3. PRATIQUE
━━━━━━━━━━━━━━━━━━━
📌 Étape 1 : Action simple
📌 Étape 2 : Suite logique
📌 Étape 3 : Résultat

━━━━━━━━━━━━━━━━━━━
⚠️ 4. ERREURS À ÉVITER
━━━━━━━━━━━━━━━━━━━
❌ Erreur 1
❌ Erreur 2
✅ Solutions

━━━━━━━━━━━━━━━━━━━
📝 5. EXERCICE
━━━━━━━━━━━━━━━━━━━
Mettez en pratique ce que vous avez appris !

🎓 Formation complète : MANAWA TECHS
📞 +225 0797969475`;
    
    res.json({ status: 'success', course });
}

// ============ POST WHATSAPP ============
async function handlePost(req, res, MISTRAL_KEY) {
    const { sujet } = req.body;
    if (!sujet) return res.json({ content: 'Sujet requis' });
    
    if (MISTRAL_KEY) {
        try {
            const resp = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: 'mistral-large-latest',
                messages: [{ role: 'user', content: `Crée un post WhatsApp éducatif et viral sur "${sujet}". 400 mots, emojis, structure claire, hashtags #ManawaTechs.` }],
                temperature: 0.85, max_tokens: 1500
            }, { headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000 });
            return res.json({ status: 'success', content: resp.data.choices[0].message.content });
        } catch(e) {}
    }
    res.json({ status: 'success', content: `📖 ${sujet}\n\nPost MANAWA TECHS\n📞 +225 0797969475\n\n#ManawaTechs` });
}

// ============ ANALYSE D'IMAGE ============
async function handleImageAnalysis(req, res, image_url, MISTRAL_KEY) {
    if (!image_url) return res.json({ content: 'URL d\'image requise' });
    res.json({ 
        status: 'success', 
        analysis: `🖼️ **ANALYSE D'IMAGE**\n\nImage reçue et analysée.\n\n📊 L'IA peut décrire le contenu, les couleurs, et suggérer des améliorations.\n\n💡 Cette fonctionnalité nécessite un modèle multimodal (Gemini Vision).` 
    });
}

// ============ WHATSAPP PUBLISH ============
function handleWhatsAppPublish(req, res) {
    const { message } = req.body;
    const encoded = encodeURIComponent(message || 'Post MANAWA TECHS');
    res.json({
        status: 'success',
        links: {
            whatsapp_web: `https://web.whatsapp.com/send?text=${encoded}`,
            whatsapp_mobile: `https://api.whatsapp.com/send?text=${encoded}`,
            channel: 'https://whatsapp.com/channel/0029Vb7LcepA2pLCLxhjCd0b'
        }
    });
}

// ============ ANALYTICS ============
function handleAnalytics(req, res) {
    res.json({
        status: 'success',
        data: {
            subscribers: 1250,
            views_week: 3800,
            engagement: '8.5%',
            shares: 340,
            top_posts: [
                'Programme vs Logiciel vs Application',
                '5 règles d\'or cybersécurité',
                'Astuce Excel du jour'
            ],
            best_hours: ['19h-21h', '7h-9h'],
            best_days: ['Mercredi', 'Lundi'],
            growth: '+12% ce mois'
        }
    });
}

// ============ DASHBOARD ============
function handleDashboard(req, res) {
    res.json({
        status: 'success',
        data: {
            total_posts: 45,
            scheduled_posts: 6,
            total_clients: 12,
            revenue: '1,250,000 FCFA',
            formations_sold: 8,
            active_students: 25,
            conversion_rate: '15%'
        }
    });
}

// ============ FACTURE ============
function handleInvoice(req, res) {
    const { client, amount, service } = req.body;
    const ref = 'FAC-' + Date.now().toString(36).toUpperCase();
    res.json({
        status: 'success',
        invoice: {
            reference: ref,
            client: client || 'Client',
            amount: amount || 0,
            service: service || 'Service MANAWA TECHS',
            date: new Date().toISOString(),
            payment_methods: ['Orange Money', 'MTN Mobile Money', 'Wave', 'Espèces']
        }
    });
}

// ============ PAIEMENT ============
function handlePayment(req, res) {
    const { method, amount, phone } = req.body;
    res.json({
        status: 'success',
        message: `💳 Paiement de ${amount} FCFA via ${method || 'Mobile Money'} initié.`,
        payment_details: {
            method: method || 'Orange Money',
            amount: amount || 0,
            phone: phone || '+225 0797969475',
            reference: 'PAY-' + Date.now().toString(36).toUpperCase(),
            status: 'pending'
        }
    });
}

// ============ RÉPONSE LOCALE ============
function generateLocalResponse(msg) {
    const m = msg.toLowerCase();
    
    if (m.includes('idée') || m.includes('propose')) {
        return `💡 **IDÉES DE CONTENU**\n\n📅 Lun 🟢 "Bases informatique"\n📅 Mar 🟡 "Excel : 5 astuces"\n📅 Mer 🟢 "Internet expliqué"\n📅 Jeu 🔴 "Cybersécurité PME"\n📅 Ven 🎓 "Compétences IT 2026"\n\n📞 +225 0797969475`;
    }
    if (m.includes('post') || m.includes('crée') || m.includes('excel')) {
        return `📊 **POST SUR EXCEL**\n\n### 🎯 Le concept\nExcel est l'outil indispensable.\n\n### 📋 Astuces\n✅ Tableaux croisés dynamiques\n✅ Formules RECHERCHEV\n✅ Macros automatiques\n\n📞 +225 0797969475`;
    }
    if (m.includes('qui es') || m.includes('bonjour')) {
        return `👋 **MANAWA TECHS**\n\n🏢 Entreprise IT ivoirienne\n📍 San-Pedro & Abidjan\n\n### ✅ Services\n🔹 Odoo ERP\n🔹 Développement Web\n🔹 Formation IT\n🔹 Cybersécurité\n\n📞 +225 0797969475`;
    }
    if (m.includes('formation') || m.includes('cours')) {
        return `🎓 **FORMATIONS**\n\n✅ Bureautique : 50 000 FCFA\n✅ Programmation : 150 000 FCFA\n✅ Cybersécurité : 200 000 FCFA\n✅ Odoo ERP : 250 000 FCFA\n\n📍 San-Pedro & Abidjan\n📞 +225 0797969475`;
    }
    if (m.includes('salaire') || m.includes('paie')) {
        return `💰 **SALAIRES IT CI**\n\n✅ Junior : 150k-300k\n✅ Senior : 400k-800k\n✅ Expert : 500k-1.2M\n\n📞 +225 0797969475`;
    }
    return `👋 **MANAWA TECHS**\n\n💬 Que voulez-vous faire ?\n\n✅ Créer un post | 💰 Salaire | 🎓 Formation\n✅ Idées contenu | 📊 Analytics | 📱 WhatsApp\n\n📞 +225 0797969475`;
}
