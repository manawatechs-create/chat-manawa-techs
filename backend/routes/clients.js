const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const clients = await db('clients').orderBy('first_contact', 'desc').limit(50);
        res.json({ status: 'success', data: clients });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { nom, prenom, telephone, type_client, entreprise, email } = req.body;
        
        if (!nom || !telephone) {
            return res.status(400).json({ status: 'error', message: 'Nom et téléphone requis' });
        }

        const [client] = await db('clients').insert({
            first_name: prenom || '',
            last_name: nom,
            phone: telephone,
            type: type_client || 'prospect',
            company: entreprise || '',
            email: email || '',
            status: 'prospect'
        }).returning('*');

        res.status(201).json({ status: 'success', data: client });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ status: 'error', message: 'Ce téléphone existe déjà' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const [client] = await db('clients').where('id', req.params.id).update(req.body).returning('*');
        if (!client) return res.status(404).json({ status: 'error', message: 'Client non trouvé' });
        res.json({ status: 'success', data: client });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db('clients').where('id', req.params.id).del();
        res.json({ status: 'success', message: 'Client supprimé' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
