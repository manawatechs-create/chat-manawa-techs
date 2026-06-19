require('dotenv').config();
const db = require('./database');

async function migrate() {
    try {
        console.log('🔄 Démarrage de la migration...');

        await db.schema.dropTableIfExists('messages_envoyes');
        await db.schema.dropTableIfExists('planning_editorial');
        await db.schema.dropTableIfExists('campagnes');
        await db.schema.dropTableIfExists('clients');
        await db.schema.dropTableIfExists('posts');

        await db.schema.createTable('posts', (table) => {
            table.increments('id').primary();
            table.string('titre', 255).notNullable();
            table.text('contenu').notNullable();
            table.string('categorie', 50).notNullable();
            table.string('domaine', 100);
            table.string('statut', 20).defaultTo('brouillon');
            table.timestamp('date_creation').defaultTo(db.fn.now());
            table.timestamp('date_publication');
            table.integer('reactions').defaultTo(0);
        });

        await db.schema.createTable('clients', (table) => {
            table.increments('id').primary();
            table.string('nom', 255).notNullable();
            table.string('prenom', 255);
            table.string('entreprise', 255);
            table.string('telephone', 20).unique().notNullable();
            table.string('email', 255);
            table.string('type_client', 50).notNullable();
            table.string('secteur_activite', 255);
            table.text('interets');
            table.string('statut', 20).defaultTo('prospect');
            table.timestamp('date_premier_contact').defaultTo(db.fn.now());
            table.timestamp('derniere_relance');
            table.text('notes');
        });

        await db.schema.createTable('campagnes', (table) => {
            table.increments('id').primary();
            table.string('nom', 255).notNullable();
            table.text('description');
            table.string('service_cible', 255).notNullable();
            table.text('message_template').notNullable();
            table.timestamp('date_debut').defaultTo(db.fn.now());
            table.timestamp('date_fin');
            table.string('statut', 20).defaultTo('active');
        });

        await db.schema.createTable('messages_envoyes', (table) => {
            table.increments('id').primary();
            table.integer('client_id').references('id').inTable('clients').onDelete('CASCADE');
            table.integer('campagne_id').references('id').inTable('campagnes').onDelete('SET NULL');
            table.text('contenu').notNullable();
            table.string('type_message', 30).notNullable();
            table.timestamp('date_envoi').defaultTo(db.fn.now());
            table.text('reponse_client');
            table.string('statut', 20).defaultTo('envoye');
        });

        await db.schema.createTable('planning_editorial', (table) => {
            table.increments('id').primary();
            table.integer('post_id').references('id').inTable('posts').onDelete('CASCADE');
            table.date('date_prevue').notNullable();
            table.time('heure_prevue').notNullable();
            table.string('plateforme', 50).defaultTo('whatsapp');
            table.string('statut', 20).defaultTo('planifie');
        });

        console.log('✅ Migration terminée avec succès !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur de migration:', error);
        process.exit(1);
    }
}

migrate();
