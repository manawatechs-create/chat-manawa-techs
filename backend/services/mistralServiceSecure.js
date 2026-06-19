const MistralClient = require('@mistralai/mistralai').default;
const keyManager = require('../config/apiKeyManager');

class SecureMistralService {
    constructor() {
        this.client = null;
        this.initializeClient();
    }

    initializeClient() {
        try {
            // Récupérer la clé de manière sécurisée
            let apiKey;
            
            // Priorité 1: Variable d'environnement
            if (process.env.MISTRAL_API_KEY && !process.env.MISTRAL_API_KEY.includes('votre_cle')) {
                apiKey = process.env.MISTRAL_API_KEY;
            }
            // Priorité 2: Fichier chiffré
            else if (keyManager.hasKey('mistral')) {
                apiKey = keyManager.getKey('mistral');
            }
            else {
                console.warn('⚠️ Aucune clé API Mistral configurée');
                return;
            }

            this.client = new MistralClient(apiKey);
            console.log('✅ Client Mistral initialisé de manière sécurisée');
        } catch (error) {
            console.error('❌ Erreur initialisation Mistral:', error.message);
        }
    }

    // Vérification que le client est prêt
    isReady() {
        return !!this.client;
    }

    async generatePost(domaine, type, instructions = '') {
        if (!this.isReady()) {
            throw new Error('Service Mistral non configuré');
        }
        // ... même code que le service mistral original
    }
}

module.exports = new SecureMistralService();
