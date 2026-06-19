require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/database');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

const MISTRAL_KEY = process.env.MISTRAL_API_KEY;
const CONTACT = '+225 0797969475';
const SITE = 'https://manawatechs.web.app';

console.log('🔑 Mistral:', MISTRAL_KEY ? '✅' : '❌');

// ============ INIT DB ============
async function initDB() {
    try {
        if (!await db.schema.hasTable('conversations')) {
            await db.schema.createTable('conversations', t => {
                t.increments('id').primary(); t.string('session_id', 100); t.string('role', 20);
                t.text('content'); t.timestamp('created_at').defaultTo(db.fn.now());
            });
        }
        if (!await db.schema.hasTable('chat_sessions')) {
            await db.schema.createTable('chat_sessions', t => {
                t.increments('id').primary(); t.string('session_id', 100).unique();
                t.string('title', 255); t.timestamp('created_at').defaultTo(db.fn.now()); t.timestamp('updated_at').defaultTo(db.fn.now());
            });
        }
        if (!await db.schema.hasTable('scheduled_posts')) {
            await db.schema.createTable('scheduled_posts', t => {
                t.increments('id').primary(); t.text('content'); t.string('theme', 255);
                t.string('status', 20).defaultTo('pending'); t.timestamp('scheduled_at');
                t.timestamp('published_at'); t.timestamp('created_at').defaultTo(db.fn.now());
            });
        }
        if (!await db.schema.hasTable('posts')) {
            await db.schema.createTable('posts', t => {
                t.increments('id').primary(); t.string('title', 255); t.text('content');
                t.string('category', 50); t.string('status', 20).defaultTo('draft'); t.timestamp('created_at').defaultTo(db.fn.now());
            });
        }
        if (!await db.schema.hasTable('clients')) {
            await db.schema.createTable('clients', t => {
                t.increments('id').primary(); t.string('first_name', 255); t.string('last_name', 255);
                t.string('phone', 20); t.string('status', 20).defaultTo('prospect'); t.timestamp('first_contact').defaultTo(db.fn.now());
            });
        }
        console.log('✅ DB prête');
    } catch(e) { console.log('⚠️ DB:', e.message); }
}
initDB();

// ============ UPLOAD ============
if (!fs.existsSync(path.join(__dirname, 'uploads'))) fs.mkdirSync(path.join(__dirname, 'uploads'));
const upload = multer({ storage: multer.diskStorage({ destination: path.join(__dirname, 'uploads'), filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname) }), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ status: 'error' });
    let text = '';
    try {
        const fp = req.file.path;
        if (fp.endsWith('.txt')) text = fs.readFileSync(fp, 'utf8');
        else if (fp.endsWith('.pdf')) { try { text = (await require('pdf-parse')(fs.readFileSync(fp))).text; } catch(e) {} }
        else if (fp.endsWith('.docx')) { try { text = (await require('mammoth').extractRawText({path:fp})).value; } catch(e) {} }
        const analysis = await callAI('Analyse ce document : ' + (text || 'Fichier').substring(0, 4000));
        res.json({ status: 'success', filename: req.file.originalname, analysis });
    } catch(e) { res.json({ status: 'success', filename: req.file.originalname, analysis: 'Fichier analysé.' }); }
});

// ============ IA ============
const SYSTEM_PROMPT = `Tu es Manawa, assistant IA de MANAWA TECHS (Côte d'Ivoire). Contact: ${CONTACT}. Réponds en français avec Markdown (### titres, **gras**, ✅ listes). Sois structuré et chaleureux. Termine par 📞 ${CONTACT}.`;

async function callAI(message) {
    if (MISTRAL_KEY) {
        try {
            const res = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: 'mistral-large-latest',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: message }],
                temperature: 0.8, max_tokens: 2000
            }, { headers: { 'Authorization': `Bearer ${MISTRAL_KEY}`, 'Content-Type': 'application/json' }, timeout: 25000 });
            const c = res.data?.choices?.[0]?.message?.content;
            if (c?.length > 10) { console.log('✅ Mistral'); return c; }
        } catch(e) { console.log('⚠️ Mistral:', e.response?.status); }
    }
    return localResponse(message);
}

function localResponse(msg) {
    const m = msg.toLowerCase();
    if (/qui es/.test(m)) return `👋 **MANAWA TECHS**\n\n### 🏢 Qui sommes-nous ?\nEntreprise IT ivoirienne (San-Pedro & Abidjan).\n\n### ✅ Services\n🔹 Odoo ERP\n🔹 Développement Web\n🔹 Formation IT\n🔹 Cybersécurité\n\n📞 **${CONTACT}**`;
    if (/salaire/.test(m)) return `💰 **SALAIRES IT CI**\n\n✅ Junior: 150k-300k FCFA\n✅ Senior: 400k-800k FCFA\n✅ Expert: 500k-1.2M FCFA\n\n📞 ${CONTACT}`;
    if (/formation/.test(m)) return `🎓 **FORMATIONS**\n\n✅ Bureautique: 50 000 FCFA\n✅ Programmation: 150 000 FCFA\n✅ Cybersécurité: 200 000 FCFA\n\n📞 ${CONTACT}`;
    return `👋 **MANAWA TECHS**\n\n💬 Que voulez-vous savoir ?\n📞 ${CONTACT}`;
}

// ============ API ============
app.post('/api/manawa/chat', async (req, res) => {
    const { message, session_id } = req.body;
    if (!message?.trim()) return res.json({ status: 'success', content: '👋 Dites-moi quelque chose !' });
    const sid = session_id || ('sess_' + Date.now());
    try { await db('conversations').insert({ session_id: sid, role: 'user', content: message }); } catch(e) {}
    const content = await callAI(message);
    try { await db('conversations').insert({ session_id: sid, role: 'assistant', content }); } catch(e) {}
    res.json({ status: 'success', content, session_id: sid });
});

app.post('/api/manawa/post', async (req, res) => {
    const content = await callAI(`Crée un post WhatsApp sur "${req.body.sujet}". 400 mots. #ManawaTechs.`);
    res.json({ status: 'success', content });
});

app.post('/api/manawa/image', (req, res) => {
    res.json({ status: 'success', imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(req.body.prompt)}?width=1080&height=1080&nologo=true` });
});

app.post('/api/manawa/code', async (req, res) => {
    const content = await callAI(`Code ${req.body.language||'Python'} : ${req.body.task}. Complet, commenté.`);
    res.json({ status: 'success', content });
});

app.post('/api/schedule/weekly', async (req, res) => {
    const themes = ['Les bases de l\'informatique','Astuce Excel','Cybersécurité','Linux essentiel','Compétences IT 2026','Témoignage MANAWA'];
    const results = [];
    for (const theme of themes) {
        const content = await callAI(`Crée un post WhatsApp sur "${theme}". 300 mots. #ManawaTechs.`);
        const [post] = await db('scheduled_posts').insert({ content, theme, status: 'pending', scheduled_at: new Date(Date.now() + 3600000).toISOString() }).returning('*');
        results.push(post);
    }
    res.json({ status: 'success', posts: results });
});

app.get('/api/chat/sessions', async (req, res) => { try { res.json({ status: 'success', data: await db('chat_sessions').orderBy('updated_at', 'desc').limit(20) }); } catch(e) { res.json({ status: 'success', data: [] }); } });
app.get('/api/chat/history/:sid', async (req, res) => { try { res.json({ status: 'success', data: await db('conversations').where('session_id', req.params.sid).orderBy('created_at', 'asc') }); } catch(e) { res.json({ status: 'success', data: [] }); } });
app.get('/api/health', (req, res) => res.json({ status: 'success', version: '13.0', mistral: !!MISTRAL_KEY }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));
app.use('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.listen(PORT, () => console.log(`\n🚀 MANAWA TECHS v13 - http://localhost:${PORT}\n`));
