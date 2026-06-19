const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const EventEmitter = require('events');

class WhatsAppService extends EventEmitter {
    constructor() {
        super();
        this.client = null;
        this.isReady = false;
        this.stats = {
            messagesSent: 0,
            messagesReceived: 0,
            lastActivity: null
        };
    }

    async initialize() {
        this.client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.client.on('qr', (qr) => {
            console.log('📱 Scannez ce QR Code avec WhatsApp :');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('✅ WhatsApp connecté !');
            this.isReady = true;
            this.emit('ready');
        });

        this.client.on('message', async (message) => {
            this.stats.messagesReceived++;
            this.stats.lastActivity = new Date();
            this.emit('message', message);
            
            // Réponse automatique
            await this.handleIncomingMessage(message);
        });

        await this.client.initialize();
        return this;
    }

    async handleIncomingMessage(message) {
        const text = message.body.toLowerCase();
        
        // Mots-clés de détection
        const keywords = {
            'prix': 'Nos prix varient selon le service. Pouvez-vous préciser votre besoin ?',
            'devis': 'Je peux vous faire un devis gratuit. Quel service vous intéresse ?',
            'formation': 'Nous proposons des formations en :\n• Bureautique\n• Programmation\n• Réseaux\n• Sécurité\n\nQuel domaine vous intéresse ?',
            'contact': '📞 +225 0797969475\n📧 contact@manawatechs.ci',
            'bonjour': 'Bonjour ! 👋 Comment puis-je vous aider aujourd\'hui ?'
        };

        for (const [keyword, response] of Object.entries(keywords)) {
            if (text.includes(keyword)) {
                await message.reply(response);
                this.stats.messagesSent++;
                return;
            }
        }
    }

    async sendMessage(phone, message) {
        if (!this.isReady) throw new Error('WhatsApp non connecté');
        
        const chatId = `${phone}@c.us`;
        await this.client.sendMessage(chatId, message);
        this.stats.messagesSent++;
        this.stats.lastActivity = new Date();
        return true;
    }

    async sendMedia(phone, mediaPath, caption = '') {
        if (!this.isReady) throw new Error('WhatsApp non connecté');
        
        const chatId = `${phone}@c.us`;
        const { MessageMedia } = require('whatsapp-web.js');
        const media = MessageMedia.fromFilePath(mediaPath);
        await this.client.sendMessage(chatId, media, { caption });
        return true;
    }

    async sendBroadcast(phones, message) {
        const results = [];
        for (const phone of phones) {
            try {
                await this.sendMessage(phone, message);
                results.push({ phone, status: 'success' });
                await new Promise(r => setTimeout(r, 2000)); // Délai anti-spam
            } catch (error) {
                results.push({ phone, status: 'failed', error: error.message });
            }
        }
        return results;
    }

    getStats() {
        return {
            ...this.stats,
            isReady: this.isReady
        };
    }
}

module.exports = new WhatsAppService();
