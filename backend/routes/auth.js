const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Inscription
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Vérifier si l'utilisateur existe
        const existingUser = await db('users').where({ email }).orWhere({ username }).first();
        if (existingUser) {
            return res.status(400).json({ status: 'error', message: 'Utilisateur déjà existant' });
        }
        
        // Hasher le mot de passe
        const passwordHash = await bcrypt.hash(password, 12);
        
        // Créer l'utilisateur
        const [user] = await db('users').insert({
            username,
            email,
            password_hash: passwordHash,
            role_id: 2 // Rôle par défaut : éditeur
        }).returning(['id', 'username', 'email', 'role_id']);
        
        const token = jwt.sign({ id: user.id, role: user.role_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ status: 'success', data: { user, token } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await db('users').where({ email }).first();
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Email ou mot de passe incorrect' });
        }
        
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ status: 'error', message: 'Email ou mot de passe incorrect' });
        }
        
        // Mettre à jour last_login
        await db('users').where('id', user.id).update({ last_login: new Date() });
        
        const token = jwt.sign({ id: user.id, role: user.role_id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        const { password_hash, ...userWithoutPassword } = user;
        
        res.json({ status: 'success', data: { user: userWithoutPassword, token } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Profil utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await db('users')
            .select('id', 'username', 'email', 'role_id', 'avatar_url', 'created_at', 'last_login')
            .where('id', req.user.id)
            .first();
        
        res.json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
