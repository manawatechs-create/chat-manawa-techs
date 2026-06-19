const express = require('express');
const router = express.Router();
const db = require('../config/database');

// ============ PIPELINE ============

// Récupérer le pipeline
router.get('/pipeline', async (req, res) => {
    try {
        const stages = await db('pipeline_stages').orderBy('order');
        
        for (let stage of stages) {
            stage.clients = await db('client_pipeline')
                .join('clients', 'client_pipeline.client_id', 'clients.id')
                .where('client_pipeline.stage_id', stage.id)
                .select('clients.*', 'client_pipeline.notes as stage_notes', 'client_pipeline.moved_at');
        }
        
        res.json({ status: 'success', data: stages });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Déplacer un client dans le pipeline
router.put('/pipeline/move', async (req, res) => {
    try {
        const { client_id, stage_id, notes } = req.body;
        
        await db('client_pipeline')
            .where('client_id', client_id)
            .del();
        
        await db('client_pipeline').insert({
            client_id,
            stage_id,
            notes,
            moved_at: new Date(),
            moved_by: req.user.id
        });
        
        // Mettre à jour le statut du client
        const stage = await db('pipeline_stages').where('id', stage_id).first();
        if (stage.name === 'Client') {
            await db('clients').where('id', client_id).update({ status: 'client' });
        }
        
        res.json({ status: 'success', message: 'Client déplacé' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============ DEVIS ============

// Créer un devis
router.post('/devis', async (req, res) => {
    try {
        const { client_id, services, total_ht, total_ttc, valid_until } = req.body;
        
        const reference = 'DEV-' + Date.now().toString(36).toUpperCase();
        
        const [devis] = await db('devis').insert({
            reference,
            client_id,
            services: JSON.stringify(services),
            total_ht,
            total_ttc,
            valid_until,
            status: 'draft'
        }).returning('*');
        
        res.status(201).json({ status: 'success', data: devis });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Lister les devis
router.get('/devis', async (req, res) => {
    try {
        const devis = await db('devis')
            .join('clients', 'devis.client_id', 'clients.id')
            .select('devis.*', 'clients.first_name', 'clients.last_name', 'clients.company')
            .orderBy('devis.created_at', 'desc');
        
        res.json({ status: 'success', data: devis });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============ FACTURES ============

// Créer une facture depuis un devis
router.post('/invoices', async (req, res) => {
    try {
        const { devis_id } = req.body;
        
        const devis = await db('devis').where('id', devis_id).first();
        if (!devis) return res.status(404).json({ status: 'error', message: 'Devis non trouvé' });
        
        const reference = 'FAC-' + Date.now().toString(36).toUpperCase();
        
        const [invoice] = await db('invoices').insert({
            reference,
            devis_id,
            client_id: devis.client_id,
            amount: devis.total_ttc,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            status: 'pending'
        }).returning('*');
        
        // Mettre à jour le statut du devis
        await db('devis').where('id', devis_id).update({ status: 'accepted' });
        
        res.status(201).json({ status: 'success', data: invoice });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Enregistrer un paiement
router.post('/payments', async (req, res) => {
    try {
        const { invoice_id, amount, method, reference } = req.body;
        
        const [payment] = await db('payments').insert({
            invoice_id,
            amount,
            method,
            reference,
            paid_at: new Date()
        }).returning('*');
        
        // Vérifier si la facture est totalement payée
        const invoice = await db('invoices').where('id', invoice_id).first();
        const totalPaid = await db('payments')
            .where('invoice_id', invoice_id)
            .sum('amount as total')
            .first();
        
        if (parseFloat(totalPaid.total) >= parseFloat(invoice.amount)) {
            await db('invoices').where('id', invoice_id).update({
                status: 'paid',
                paid_at: new Date()
            });
        }
        
        res.status(201).json({ status: 'success', data: payment });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
