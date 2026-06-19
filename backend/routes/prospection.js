const express = require('express');
const router = express.Router();
const db = require('../config/database');
const mistralService = require('../services/mistralService');

router.post('/generate', async (req, res) => {
    try {
        const { service, client_id } = req.body;
        
        if (!service) {
            return res.status(400).json({ status: 'error', message: 'Service requis' });
        }

        let clientData = null;
        if (client_id) {
            clientData = await db('clients').where('id', client_id).first();
        }

        const message = await mistralService.generateProspectionMessage(clientData, service);
        
        res.json({ status: 'success', data: { message } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.post('/script', async (req, res) => {
    try {
        const { produit } = req.body;
        if (!produit) return res.status(400).json({ status: 'error', message: 'Produit requis' });
        
        const script = await mistralService.generateSalesScript(produit);
        res.json({ status: 'success', data: { script } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
