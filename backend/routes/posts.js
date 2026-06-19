const express = require('express');
const router = express.Router();
const db = require('../config/database');
const mistralService = require('../services/mistralService');
const imageService = require('../services/imageService');

// GET /api/posts
router.get('/', async (req, res) => {
    try {
        const posts = await db('posts').orderBy('created_at', 'desc').limit(20);
        res.json({ status: 'success', data: posts });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/posts/generate
router.post('/generate', async (req, res) => {
    try {
        const { domaine, type, instructions } = req.body;
        
        if (!domaine) {
            return res.status(400).json({ status: 'error', message: 'Domaine requis' });
        }

        const contenu = await mistralService.generatePost(domaine, type || 'expertise', instructions || '');
        
        const [post] = await db('posts').insert({
            title: `Post ${type || 'expertise'} - ${domaine}`,
            content: contenu,
            category: type || 'expertise',
            domain: domaine,
            status: 'draft',
            user_id: 1
        }).returning('*');

        res.status(201).json({ status: 'success', message: 'Post généré', data: post });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/posts/generate-image
router.post('/generate-image', async (req, res) => {
    try {
        const { theme, style } = req.body;
        const imageUrl = await imageService.generateIllustration(theme || 'default', style || 'professional');
        res.json({ status: 'success', data: { imageUrl } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT /api/posts/:id
router.put('/:id', async (req, res) => {
    try {
        const [post] = await db('posts').where('id', req.params.id).update(req.body).returning('*');
        if (!post) return res.status(404).json({ status: 'error', message: 'Post non trouvé' });
        res.json({ status: 'success', data: post });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/posts/:id
router.delete('/:id', async (req, res) => {
    try {
        await db('posts').where('id', req.params.id).del();
        res.json({ status: 'success', message: 'Post supprimé' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
