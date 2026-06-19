class MistralService {
    constructor() {
        this.apiKey = process.env.MISTRAL_API_KEY;
        this.isConfigured = this.apiKey && this.apiKey !== 'votre_cle_api_mistral_ici' && this.apiKey.length > 10;
        
        if (this.isConfigured) {
            const MistralClient = require('@mistralai/mistralai').default;
            this.client = new MistralClient(this.apiKey);
            console.log('✅ Mistral API configurée');
        } else {
            console.log('⚠️ Mistral API non configurée - mode démo');
        }
    }

    async generatePost(domaine, type, instructions) {
        // Si Mistral pas configuré, retourner un post de démo
        if (!this.isConfigured) {
            return this.getDemoPost(domaine, type);
        }

        try {
            const MistralClient = require('@mistralai/mistralai').default;
            const client = new MistralClient(this.apiKey);
            
            const systemPrompt = `Tu es MANAWA TECHS, expert IT en Côte d'Ivoire. Écris un post WhatsApp percutant (300-500 caractères) avec emojis.`;
            
            const response = await client.chat({
                model: 'mistral-large-latest',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Post ${type} sur ${domaine}. Instructions: ${instructions || ''}` }
                ],
                temperature: 0.8,
                maxTokens: 500
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Erreur Mistral:', error.message);
            return this.getDemoPost(domaine, type);
        }
    }

    async generateProspectionMessage(clientData, service) {
        if (!this.isConfigured) {
            return `Bonjour ! Je suis de MANAWA TECHS. Nous proposons des services en ${service} pour les entreprises en Côte d'Ivoire. Souhaitez-vous en savoir plus ? 📞 +225 0797969475`;
        }
        // ... même logique que ci-dessus
        return `Message de prospection pour ${service}`;
    }

    async generateSalesScript(produit) {
        if (!this.isConfigured) {
            return `SCRIPT DE VENTE - ${produit}\n\n1. Bonjour, présentation\n2. Bénéfices du produit\n3. Témoignages clients\n4. Offre et appel à l'action`;
        }
        return `Script de vente pour ${produit}`;
    }

    getDemoPost(domaine, type) {
        const posts = {
            odoo: `💼 Votre entreprise utilise encore Excel pour tout gérer ?\n\nAvec Odoo ERP, centralisez vos stocks, ventes et compta en un seul outil. Gain de temps garanti !\n\n👉 Intéressé ? Contactez-nous : +225 0797969475\n\n#MANAWA_TECHS #Odoo #ERP`,
            web: `🌐 Votre entreprise n'a pas encore de site web professionnel ?\n\nEn 2026, vos clients vous cherchent d'abord sur internet. Ne passez pas à côté !\n\n✨ Site vitrine, e-commerce, application web... On s'occupe de tout !\n\n📞 +225 0797969475`,
            ia: `🤖 L'Intelligence Artificielle n'est plus réservée aux grandes entreprises !\n\nDécouvrez comment l'IA peut automatiser vos tâches et booster votre productivité.\n\n🎓 Formation IA disponible chez MANAWA TECHS\n\n📞 +225 0797969475`,
            formation: `🎓 Boostez votre carrière avec nos formations IT !\n\n✅ Bureautique\n✅ Programmation\n✅ Réseaux & Sécurité\n✅ Intelligence Artificielle\n\n📍 San-Pedro & Abidjan\n📞 +225 0797969475`,
            securite: `🔒 Protégez votre entreprise contre les cyberattaques !\n\n3 conseils essentiels :\n1️⃣ Mots de passe robustes\n2️⃣ Mises à jour régulières\n3️⃣ Sauvegardes automatiques\n\nBesoin d'un audit ? 📞 +225 0797969475`,
            imprimerie: `🖨️ Besoin de bâches, flyers ou vinyles ?\n\nMANAWA TECHS fait aussi de l'imprimerie numérique de qualité !\n\n🎨 Design pro\n⚡ Livraison rapide\n💰 Prix compétitifs\n\n📞 +225 0797969475`,
            linux: `🐧 Pourquoi les entreprises migrent vers Linux ?\n\n✅ Plus sécurisé\n✅ Gratuit\n✅ Stable\n✅ Personnalisable\n\nOn vous accompagne dans la migration ! 📞 +225 0797969475`
        };
        
        return posts[domaine] || `💡 MANAWA TECHS - Votre partenaire IT en Côte d'Ivoire\n\nExpert en ${domaine} à San-Pedro & Abidjan\n📞 +225 0797969475\n🌐 manawatechs.web.app`;
    }
}

module.exports = new MistralService();
