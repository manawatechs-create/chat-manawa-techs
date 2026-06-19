const express = require('express');
const router = express.Router();
const db = require('../config/database');
const automationService = require('../services/automationService');

// Programmer une publication
router.post('/schedule', async (req, res) => {
    try {
        const { post_id, scheduled_at } = req.body;
        
        const [scheduled] = await db('scheduled_posts').insert({
            post_id,
            user_id: req.user.id,
            scheduled_at,
            status: 'pending'
        }).returning('*');
        
        res.status(201).json({ status: 'success', data: scheduled });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Voir les publications programmées
router.get('/scheduled', async (req, res) => {
    try {
        const scheduled = await db('scheduled_posts')
            .join('posts', 'scheduled_posts.post_id', 'posts.id')
            .select('scheduled_posts.*', 'posts.title', 'posts.content')
            .orderBy('scheduled_posts.scheduled_at');
        
        res.json({ status: 'success', data: scheduled });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Annuler une publication programmée
router.delete('/scheduled/:id', async (req, res) => {
    try {
        await db('scheduled_posts').where('id', req.params.id).update({ status: 'cancelled' });
        res.json({ status: 'success', message: 'Publication annulée' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Statut de l'automatisation
router.get('/status', (req, res) => {
    res.json({
        status: 'success',
        data: {
            jobs: Object.keys(automationService.jobs),
            whatsapp: require('../services/whatsappService').getStats()
        }
    });
});

module.exports = router;
