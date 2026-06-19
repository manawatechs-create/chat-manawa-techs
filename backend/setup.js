const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 MANAWA TECHS - Installation automatique\n');

async function setup() {
    try {
        // 1. Configuration PostgreSQL
        console.log('📦 Configuration de PostgreSQL...');
        execSync('sudo service postgresql start', { stdio: 'inherit' });
        
        // Créer l'utilisateur et la base
        execSync(`sudo -u postgres psql -c "CREATE USER manawa WITH PASSWORD 'Manawa2024!';" 2>/dev/null || true`);
        execSync(`sudo -u postgres psql -c "CREATE DATABASE manawa_techs OWNER manawa;" 2>/dev/null || true`);
        execSync(`sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE manawa_techs TO manawa;" 2>/dev/null || true`);
        
        console.log('✅ Base de données configurée\n');

        // 2. Demander la clé API Mistral
        const apiKey = await new Promise((resolve) => {
            rl.question('🔑 Entrez votre clé API Mistral : ', (answer) => {
                resolve(answer);
            });
        });

        // Mettre à jour le fichier .env
        let envContent = fs.readFileSync('.env', 'utf8');
        envContent = envContent.replace('votre-cle-api-mistral', apiKey);
        fs.writeFileSync('.env', envContent);
        console.log('✅ Clé API configurée\n');

        // 3. Installer les dépendances
        console.log('📦 Installation des dépendances...');
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dépendances installées\n');

        // 4. Exécuter les migrations
        console.log('🗄️ Exécution des migrations...');
        execSync('node config/migrate.js', { stdio: 'inherit' });
        console.log('✅ Base de données prête\n');

        console.log('🎉 Installation terminée avec succès !');
        console.log('\nPour lancer le serveur :');
        console.log('  npm run dev');
        console.log('\nAPI disponible sur : http://localhost:3000');
        console.log('Health check : http://localhost:3000/api/health\n');

        rl.close();
    } catch (error) {
        console.error('❌ Erreur lors de l\'installation:', error.message);
        rl.close();
    }
}

setup();
