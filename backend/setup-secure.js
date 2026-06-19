const readline = require('readline');
const cryptoService = require('./utils/crypto');
const keyManager = require('./config/apiKeyManager');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔒 Configuration sécurisée de MANAWA TECHS\n');

async function setup() {
    // 1. Générer la clé de chiffrement
    const encryptionKey = cryptoService.CryptoService.generateEncryptionKey();
    
    // 2. Générer le JWT secret
    const jwtSecret = require('crypto').randomBytes(64).toString('hex');
    
    // 3. Créer le .env sécurisé
    const envContent = `# Généré le ${new Date().toISOString()}
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://localhost:5500

DB_HOST=localhost
DB_PORT=5432
DB_USER=manawa
DB_PASSWORD=Manawa2024!
DB_NAME=manawa_techs

ENCRYPTION_KEY=${encryptionKey}
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=7d
`;

    // Demander les clés API
    console.log('📝 Configuration des clés API :\n');
    
    const mistralKey = await askQuestion('Clé API Mistral (laissez vide pour ignorer) : ');
    const stabilityKey = await askQuestion('Clé API Stability AI (optionnel) : ');

    // Sauvegarder les clés de manière chiffrée
    if (mistralKey && mistralKey.length > 10) {
        keyManager.setKey('mistral', mistralKey);
        console.log('✅ Clé Mistral sécurisée');
    }
    
    if (stabilityKey && stabilityKey.length > 10) {
        keyManager.setKey('stability', stabilityKey);
        console.log('✅ Clé Stability sécurisée');
    }

    // Sauvegarder le .env (sans les clés API)
    fs.writeFileSync('.env', envContent, { mode: 0o600 });
    console.log('✅ Configuration sauvegardée\n');

    // Ajouter .env et .keys.encrypted au .gitignore
    const gitignore = `
# Fichiers sensibles - NE JAMAIS COMMIT
.env
.keys.encrypted
*.pem
*.key
*.crt
credentials.json
config/ssl/

# Logs
*.log
logs/

# Node
node_modules/
`;
    fs.writeFileSync('.gitignore', gitignore);
    
    console.log('🔒 Fichiers sensibles ajoutés au .gitignore');
    console.log('\n✅ Configuration terminée !');
    console.log('📋 Résumé :');
    console.log(`  - Clé de chiffrement : ${encryptionKey.substring(0, 8)}...`);
    console.log(`  - Clés API stockées : ${keyManager.listServices().map(s => s.service).join(', ') || 'aucune'}`);
    console.log(`  - Fichier .env créé avec permissions 600`);
    console.log(`  - Fichier .keys.encrypted créé (clés chiffrées)`);
    
    rl.close();
}

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

setup();
