const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const [totalPosts, totalClients, totalMessages, recentPosts] = await Promise.all([
            db('posts').count('id').first(),
            db('clients').count('id').first(),
            db('messages_envoyes').count('id').first(),
            db('posts').orderBy('created_at', 'desc').limit(5)
        ]);

        res.json({
            status: 'success',
            data: {
                total_posts: parseInt(totalPosts.count),
                total_clients: parseInt(totalClients.count),
                total_messages: parseInt(totalMessages.count),
                recent_posts: recentPosts
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
