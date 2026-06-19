const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Lister les templates
router.get('/', async (req, res) => {
    try {
        const { sector, category } = req.query;
        let query = db('templates');
        
        if (sector) query = query.where('sector', sector);
        if (category) query = query.where('category', category);
        
        const templates = await query.orderBy('usage_count', 'desc');
        res.json({ status: 'success', data: templates });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Créer un template
router.post('/', async (req, res) => {
    try {
        const { name, category, sector, structure, sample_content } = req.body;
        
        const [template] = await db('templates').insert({
            name,
            category,
            sector,
            structure: JSON.stringify(structure),
            sample_content
        }).returning('*');
        
        res.status(201).json({ status: 'success', data: template });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Utiliser un template (incrémenter le compteur)
router.post('/:id/use', async (req, res) => {
    try {
        await db('templates').where('id', req.params.id).increment('usage_count', 1);
        res.json({ status: 'success', message: 'Template utilisé' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
