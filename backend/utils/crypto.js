const crypto = require('crypto');

class CryptoService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        // Utiliser une clé de 32 octets depuis les variables d'environnement
        this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex');
    }

    // Chiffrer une clé API avant stockage
    encrypt(text) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        
        return JSON.stringify({
            iv: iv.toString('hex'),
            content: encrypted,
            tag: authTag.toString('hex')
        });
    }

    // Déchiffrer une clé API
    decrypt(encryptedData) {
        const { iv, content, tag } = JSON.parse(encryptedData);
        
        const decipher = crypto.createDecipheriv(
            this.algorithm, 
            this.encryptionKey, 
            Buffer.from(iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(tag, 'hex'));
        
        let decrypted = decipher.update(content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    // Générer une clé de chiffrement
    static generateEncryptionKey() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Hasher une clé pour la vérification (one-way)
    hashApiKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }
}

module.exports = new CryptoService();
module.exports.CryptoService = CryptoService;
