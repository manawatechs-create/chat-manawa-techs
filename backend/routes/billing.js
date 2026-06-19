const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Dashboard billing
router.get('/dashboard', async (req, res) => {
    try {
        const [totalRevenue, pendingInvoices, recentPayments] = await Promise.all([
            db('payments').sum('amount as total').first(),
            db('invoices').where('status', 'pending').count().first(),
            db('payments')
                .join('invoices', 'payments.invoice_id', 'invoices.id')
                .join('clients', 'invoices.client_id', 'clients.id')
                .select('payments.*', 'clients.first_name', 'clients.last_name', 'invoices.reference as invoice_ref')
                .orderBy('payments.paid_at', 'desc')
                .limit(10)
        ]);
        
        res.json({
            status: 'success',
            data: {
                total_revenue: totalRevenue.total || 0,
                pending_invoices: pendingInvoices.count,
                recent_payments: recentPayments
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Liste des factures
router.get('/invoices', async (req, res) => {
    try {
        const invoices = await db('invoices')
            .join('clients', 'invoices.client_id', 'clients.id')
            .select('invoices.*', 'clients.first_name', 'clients.last_name', 'clients.company')
            .orderBy('invoices.created_at', 'desc');
        
        res.json({ status: 'success', data: invoices });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
