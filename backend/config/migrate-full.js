require('dotenv').config();
const db = require('./database');

async function migrateFull() {
    try {
        console.log('🔄 Migration complète...');

        // Supprimer les anciennes tables
        await db.schema.dropTableIfExists('notifications');
        await db.schema.dropTableIfExists('activity_logs');
        await db.schema.dropTableIfExists('payments');
        await db.schema.dropTableIfExists('invoices');
        await db.schema.dropTableIfExists('devis');
        await db.schema.dropTableIfExists('pipeline_stages');
        await db.schema.dropTableIfExists('scheduled_posts');
        await db.schema.dropTableIfExists('carousels');
        await db.schema.dropTableIfExists('templates');
        await db.schema.dropTableIfExists('analytics_events');
        await db.schema.dropTableIfExists('messages_envoyes');
        await db.schema.dropTableIfExists('campagnes');
        await db.schema.dropTableIfExists('planning_editorial');
        await db.schema.dropTableIfExists('clients');
        await db.schema.dropTableIfExists('posts');
        await db.schema.dropTableIfExists('users');
        await db.schema.dropTableIfExists('roles');

        // ============ UTILISATEURS & RÔLES ============
        await db.schema.createTable('roles', table => {
            table.increments('id').primary();
            table.string('name', 50).notNullable().unique();
            table.text('permissions');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        await db.schema.createTable('users', table => {
            table.increments('id').primary();
            table.string('username', 100).notNullable().unique();
            table.string('email', 255).notNullable().unique();
            table.string('password_hash', 255).notNullable();
            table.integer('role_id').references('id').inTable('roles');
            table.string('avatar_url');
            table.boolean('is_active').defaultTo(true);
            table.timestamp('last_login');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        // ============ POSTS & CONTENU ============
        await db.schema.createTable('posts', table => {
            table.increments('id').primary();
            table.integer('user_id').references('id').inTable('users');
            table.string('title', 255).notNullable();
            table.text('content').notNullable();
            table.string('category', 50).notNullable();
            table.string('domain', 100);
            table.string('status', 20).defaultTo('draft');
            table.text('ai_prompt');
            table.integer('word_count');
            table.timestamp('created_at').defaultTo(db.fn.now());
            table.timestamp('published_at');
            table.integer('views').defaultTo(0);
            table.integer('clicks').defaultTo(0);
        });

        // Carrousels d'images
        await db.schema.createTable('carousels', table => {
            table.increments('id').primary();
            table.integer('post_id').references('id').inTable('posts').onDelete('CASCADE');
            table.string('title', 255);
            table.text('images_urls'); // JSON array
            table.integer('slide_count');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        // Templates de contenu
        await db.schema.createTable('templates', table => {
            table.increments('id').primary();
            table.string('name', 255).notNullable();
            table.string('category', 50);
            table.string('sector', 100);
            table.text('structure'); // JSON
            table.text('sample_content');
            table.integer('usage_count').defaultTo(0);
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        // ============ PLANIFICATION ============
        await db.schema.createTable('scheduled_posts', table => {
            table.increments('id').primary();
            table.integer('post_id').references('id').inTable('posts').onDelete('CASCADE');
            table.integer('user_id').references('id').inTable('users');
            table.timestamp('scheduled_at').notNullable();
            table.string('platform', 50).defaultTo('whatsapp');
            table.string('status', 20).defaultTo('pending');
            table.text('error_message');
            table.timestamp('sent_at');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        // ============ CLIENTS & CRM ============
        await db.schema.createTable('clients', table => {
            table.increments('id').primary();
            table.string('first_name', 255).notNullable();
            table.string('last_name', 255);
            table.string('company', 255);
            table.string('phone', 20).unique().notNullable();
            table.string('email', 255);
            table.string('type', 50);
            table.string('sector', 255);
            table.text('interests');
            table.string('status', 20).defaultTo('prospect');
            table.string('source', 100);
            table.text('notes');
            table.integer('assigned_to').references('id').inTable('users');
            table.timestamp('first_contact').defaultTo(db.fn.now());
            table.timestamp('last_contact');
        });

        // Pipeline de vente
        await db.schema.createTable('pipeline_stages', table => {
            table.increments('id').primary();
            table.string('name', 100).notNullable();
            table.integer('order').notNullable();
            table.string('color', 20);
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        await db.schema.createTable('client_pipeline', table => {
            table.increments('id').primary();
            table.integer('client_id').references('id').inTable('clients').onDelete('CASCADE');
            table.integer('stage_id').references('id').inTable('pipeline_stages');
            table.text('notes');
            table.timestamp('moved_at').defaultTo(db.fn.now());
            table.integer('moved_by').references('id').inTable('users');
        });

        // Devis et factures
        await db.schema.createTable('devis', table => {
            table.increments('id').primary();
            table.string('reference', 50).unique();
            table.integer('client_id').references('id').inTable('clients');
            table.text('services'); // JSON
            table.decimal('total_ht', 10, 2);
            table.decimal('total_ttc', 10, 2);
            table.string('status', 20).defaultTo('draft');
            table.date('valid_until');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        await db.schema.createTable('invoices', table => {
            table.increments('id').primary();
            table.string('reference', 50).unique();
            table.integer('devis_id').references('id').inTable('devis');
            table.integer('client_id').references('id').inTable('clients');
            table.decimal('amount', 10, 2);
            table.string('status', 20).defaultTo('pending');
            table.date('due_date');
            table.timestamp('paid_at');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        await db.schema.createTable('payments', table => {
            table.increments('id').primary();
            table.integer('invoice_id').references('id').inTable('invoices');
            table.decimal('amount', 10, 2);
            table.string('method', 50);
            table.string('reference', 100);
            table.timestamp('paid_at').defaultTo(db.fn.now());
        });

        // ============ AUTOMATISATION ============
        await db.schema.createTable('campaigns', table => {
            table.increments('id').primary();
            table.string('name', 255).notNullable();
            table.text('description');
            table.string('target_service', 255);
            table.text('message_template');
            table.text('follow_up_messages'); // JSON array
            table.integer('delay_hours').defaultTo(48);
            table.string('status', 20).defaultTo('active');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        await db.schema.createTable('messages_envoyes', table => {
            table.increments('id').primary();
            table.integer('client_id').references('id').inTable('clients');
            table.integer('campaign_id').references('id').inTable('campaigns');
            table.text('content');
            table.string('type', 30);
            table.string('status', 20).defaultTo('sent');
            table.text('response');
            table.timestamp('sent_at').defaultTo(db.fn.now());
            table.timestamp('responded_at');
        });

        // ============ ANALYTICS ============
        await db.schema.createTable('analytics_events', table => {
            table.increments('id').primary();
            table.string('event_type', 50).notNullable();
            table.integer('post_id').references('id').inTable('posts');
            table.integer('client_id').references('id').inTable('clients');
            table.string('platform', 50);
            table.json('metadata');
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        // ============ ACTIVITÉ & LOGS ============
        await db.schema.createTable('activity_logs', table => {
            table.increments('id').primary();
            table.integer('user_id').references('id').inTable('users');
            table.string('action', 100).notNullable();
            table.string('entity_type', 50);
            table.integer('entity_id');
            table.json('details');
            table.string('ip_address', 45);
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        await db.schema.createTable('notifications', table => {
            table.increments('id').primary();
            table.integer('user_id').references('id').inTable('users');
            table.string('title', 255);
            table.text('message');
            table.string('type', 50);
            table.boolean('is_read').defaultTo(false);
            table.timestamp('created_at').defaultTo(db.fn.now());
        });

        // ============ INDEX ============
        await db.raw('CREATE INDEX idx_posts_status ON posts(status)');
        await db.raw('CREATE INDEX idx_clients_status ON clients(status)');
        await db.raw('CREATE INDEX idx_analytics_type ON analytics_events(event_type)');
        await db.raw('CREATE INDEX idx_scheduled_at ON scheduled_posts(scheduled_at)');

        console.log('✅ Migration complète réussie !');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur migration:', error);
        process.exit(1);
    }
}

migrateFull();
