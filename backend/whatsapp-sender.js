const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('📱 Démarrage de WhatsApp...');
console.log('⏳ Patientez, le QR code va apparaître...\n');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,  // Pour voir le navigateur
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n🔍 SCANNEZ CE QR CODE AVEC WHATSAPP :\n');
    qrcode.generate(qr, { small: true });
    console.log('\n1. Ouvrez WhatsApp sur votre téléphone');
    console.log('2. Allez dans Paramètres > Appareils connectés');
    console.log('3. Scannez le QR code ci-dessus\n');
});

client.on('ready', async () => {
    console.log('✅ WhatsApp connecté !');
    console.log('📝 Prêt à envoyer des messages\n');
    
    // Test : envoyer un message à votre chaîne
    const channelId = '0029Vb7LcepA2pLCLxhjCd0b';
    const message = `🚀 MANAWA TECHS - Test automatique\n\nCe message a été envoyé automatiquement par votre assistant IA !\n\n📅 ${new Date().toLocaleDateString('fr-FR')}\n⏰ ${new Date().toLocaleTimeString('fr-FR')}`;
    
    try {
        // Envoyer à la chaîne WhatsApp
        const chat = await client.getChatById(`${channelId}@newsletter`);
        await chat.sendMessage(message);
        console.log('✅ Message envoyé à la chaîne !');
    } catch (error) {
        console.log('⚠️ Envoi chaîne non supporté, test sur un contact...');
        // Alternative : envoyer à soi-même
        const me = await client.getChatById('2250797969475@c.us');
        await me.sendMessage(message);
        console.log('✅ Message de test envoyé à votre numéro');
    }
    
    // Interface simple en ligne de commande
    console.log('\n📋 COMMANDES DISPONIBLES :');
    console.log('  Tapez votre message et appuyez sur Entrée pour l\'envoyer à la chaîne');
    console.log('  Tapez "quit" pour quitter\n');
    
    process.stdin.on('data', async (data) => {
        const text = data.toString().trim();
        if (text === 'quit') {
            console.log('👋 Au revoir !');
            process.exit(0);
        }
        try {
            await chat.sendMessage(text);
            console.log('✅ Envoyé !');
        } catch (e) {
            await me.sendMessage(text);
            console.log('✅ Envoyé à votre numéro');
        }
    });
});

client.on('disconnected', () => {
    console.log('❌ WhatsApp déconnecté');
});

client.initialize();
