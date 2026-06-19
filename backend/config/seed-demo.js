require('dotenv').config();
const db = require('./database');

async function seedDemo() {
    try {
        console.log('🌱 Création des données de démo...');

        // Créer des rôles
        await db('roles').insert([
            { id: 1, name: 'admin', permissions: JSON.stringify(['all']) },
            { id: 2, name: 'editor', permissions: JSON.stringify(['posts', 'clients']) }
        ]).onConflict('id').ignore();

        // Créer un utilisateur admin
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('admin123', 12);
        await db('users').insert({
            username: 'admin',
            email: 'admin@manawatechs.ci',
            password_hash: hash,
            role_id: 1
        }).onConflict('email').ignore();

        // Créer les étapes du pipeline
        const stages = ['Prospect', 'Contacté', 'Intéressé', 'Devis envoyé', 'Négociation', 'Client'];
        for (let i = 0; i < stages.length; i++) {
            await db('pipeline_stages').insert({
                id: i + 1,
                name: stages[i],
                order: i + 1,
                color: ['#6C5CE7', '#00CEC9', '#FDCB6E', '#FD79A8', '#E17055', '#00B894'][i]
            }).onConflict('id').ignore();
        }

        // Créer des templates
        await db('templates').insert([
            { name: 'Post expertise Odoo', category: 'expertise', sector: 'ERP', structure: '{}', sample_content: 'Post sur Odoo ERP...', usage_count: 15 },
            { name: 'Post formation IT', category: 'formation', sector: 'Éducation', structure: '{}', sample_content: 'Post formation...', usage_count: 10 },
            { name: 'Message prospection PME', category: 'prospection', sector: 'PME', structure: '{}', sample_content: 'Message prospection...', usage_count: 25 }
        ]).onConflict('id').ignore();

        // Créer des clients de démo
        const clients = [
            { first_name: 'Jean', last_name: 'Kouassi', company: 'TechSolutions CI', phone: '+22501010202', type: 'pme', sector: 'Informatique' },
            { first_name: 'Marie', last_name: 'Koné', company: 'ShopExpress', phone: '+22501010303', type: 'commercant', sector: 'Commerce' },
            { first_name: 'Paul', last_name: 'Yao', company: '', phone: '+22501010404', type: 'particulier', sector: 'Étudiant' }
        ];

        for (const c of clients) {
            await db('clients').insert(c).onConflict('phone').ignore();
        }

        // Créer un devis de démo
        const client = await db('clients').first();
        if (client) {
            await db('devis').insert({
                reference: 'DEV-001',
                client_id: client.id,
                services: JSON.stringify([{ name: 'Création site web', price: 500000 }]),
                total_ht: 500000,
                total_ttc: 590000,
                valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }).onConflict('reference').ignore();
        }

        console.log('✅ Données de démo créées !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur seed:', error);
        process.exit(1);
    }
}

seedDemo();
