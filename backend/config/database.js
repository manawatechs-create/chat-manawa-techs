const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'manawa_techs',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: {
        min: 1,
        max: 5
    }
});

// Test connexion
db.raw('SELECT 1')
    .then(() => console.log('✅ Base de données connectée'))
    .catch((err) => console.log('⚠️ DB:', err.message));

module.exports = db;
