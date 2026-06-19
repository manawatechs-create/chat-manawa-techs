#!/bin/bash

echo "🔍 Vérification de sécurité MANAWA TECHS"
echo "========================================"

# Vérifier les fichiers sensibles
echo ""
echo "📁 Vérification des fichiers sensibles..."

FILES=(".env" ".keys.encrypted")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        PERMS=$(stat -c "%a" "$file")
        if [ "$PERMS" = "600" ]; then
            echo "  ✅ $file - Permissions correctes (600)"
        else
            echo "  ⚠️  $file - Permissions: $PERMS (devrait être 600)"
            chmod 600 "$file"
            echo "     → Corrigé"
        fi
    else
        echo "  ⚠️  $file - Fichier non trouvé"
    fi
done

# Vérifier les clés API exposées
echo ""
echo "🔑 Vérification des clés API exposées..."

if grep -r "MISTRAL_API_KEY=" *.js *.json .env 2>/dev/null | grep -v ".env.example" | grep -v "process.env" | grep -v "votre_cle"; then
    echo "  ❌ ATTENTION: Clé API potentiellement exposée !"
else
    echo "  ✅ Aucune clé API trouvée dans le code source"
fi

# Vérifier les mots de passe
echo ""
echo "🔒 Vérification des mots de passe..."

if grep -r "password\s*=" *.js 2>/dev/null | grep -v "process.env" | grep -v "votre_mot"; then
    echo "  ❌ ATTENTION: Mot de passe en dur trouvé !"
else
    echo "  ✅ Aucun mot de passe en clair"
fi

# Vérifier .gitignore
echo ""
echo "📋 Vérification du .gitignore..."

if [ -f ".gitignore" ]; then
    if grep -q ".env" .gitignore && grep -q ".keys.encrypted" .gitignore; then
        echo "  ✅ .gitignore protège les fichiers sensibles"
    else
        echo "  ⚠️  .gitignore incomplet"
    fi
else
    echo "  ❌ .gitignore manquant !"
fi

echo ""
echo "✅ Vérification terminée"
