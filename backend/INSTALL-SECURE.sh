#!/bin/bash

echo "🔒 INSTALLATION SÉCURISÉE DE MANAWA TECHS"
echo "==========================================\n"

# 1. Nettoyer l'historique
echo "1. Nettoyage de l'historique..."
history -c
cat /dev/null > ~/.bash_history

# 2. Installer les dépendances
echo "2. Installation des dépendances..."
npm install

# 3. Configuration sécurisée
echo "3. Configuration des clés API..."
node setup-secure.js

# 4. Définir les permissions
echo "4. Sécurisation des fichiers..."
chmod 600 .env 2>/dev/null
chmod 600 .keys.encrypted 2>/dev/null
chmod 600 config/ssl/* 2>/dev/null

# 5. Vérification
echo "5. Vérification de sécurité..."
bash security-check.sh

echo "\n✅ Installation terminée !"
echo "🚀 Lancez avec : npm run dev"
