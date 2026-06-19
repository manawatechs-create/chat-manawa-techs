#!/bin/bash

echo "🚀 Démarrage de MANAWA TECHS Backend..."

# Vérifier et libérer le port 3000
if sudo lsof -i:3000 > /dev/null 2>&1; then
    echo "⚠️  Le port 3000 est déjà utilisé. Libération..."
    sudo fuser -k 3000/tcp
    sleep 1
    echo "✅ Port 3000 libéré"
fi

# Vérifier PostgreSQL
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo "📦 Démarrage de PostgreSQL..."
    sudo service postgresql start
fi

# Vérifier le fichier .env
if [ ! -f .env ]; then
    echo "❌ Fichier .env manquant !"
    echo "Exécutez : node setup-secure.js"
    exit 1
fi

# Lancer le serveur
echo "🔧 Démarrage du serveur..."
node server.js
