require('dotenv').config();
const cryptoService = require('../utils/crypto');
const fs = require('fs');
const path = require('path');

class ApiKeyManager {
    constructor() {
        this.keysPath = path.join(__dirname, '../.keys.encrypted');
        this.keys = {};
        this.loadKeys();
    }

    // Charger les clés chiffrées
    loadKeys() {
        try {
            if (fs.existsSync(this.keysPath)) {
                const encrypted = fs.readFileSync(this.keysPath, 'utf8');
                this.keys = JSON.parse(encrypted);
            }
        } catch (error) {
            console.error('Erreur chargement clés:', error.message);
            this.keys = {};
        }
    }

    // Sauvegarder les clés chiffrées
    saveKeys() {
        try {
            fs.writeFileSync(this.keysPath, JSON.stringify(this.keys), { mode: 0o600 });
        } catch (error) {
            console.error('Erreur sauvegarde clés:', error.message);
        }
    }

    // Ajouter une clé API chiffrée
    setKey(service, apiKey) {
        const encrypted = cryptoService.encrypt(apiKey);
        this.keys[service] = encrypted;
        this.saveKeys();
        console.log(`✅ Clé ${service} sauvegardée de manière sécurisée`);
    }

    // Récupérer une clé API déchiffrée
    getKey(service) {
        const encrypted = this.keys[service];
        if (!encrypted) {
            throw new Error(`Clé API non trouvée pour le service: ${service}`);
        }
        return cryptoService.decrypt(encrypted);
    }

    // Vérifier si une clé existe
    hasKey(service) {
        return !!this.keys[service];
    }

    // Lister les services (sans montrer les clés)
    listServices() {
        return Object.keys(this.keys).map(k => ({ service: k, configured: true }));
    }

    // Supprimer une clé
    deleteKey(service) {
        delete this.keys[service];
        this.saveKeys();
        console.log(`🗑️ Clé ${service} supprimée`);
    }
}

// Singleton
const keyManager = new ApiKeyManager();

module.exports = keyManager;
