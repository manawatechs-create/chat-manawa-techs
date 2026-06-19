const express = require('express');
const router = express.Router();
const db = require('../config/database');
const PDFDocument = require('pdfkit');

// Statistiques globales
router.get('/stats', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        let dateFilter = '';
        const params = {};
        
        if (start_date) {
            dateFilter = 'WHERE created_at >= :start_date';
            params.start_date = start_date;
        }
        if (end_date) {
            dateFilter += dateFilter ? ' AND created_at <= :end_date' : 'WHERE created_at <= :end_date';
            params.end_date = end_date;
        }
        
        const stats = {
            total_posts: (await db('posts').count())[0].count,
            total_clients: (await db('clients').count())[0].count,
            total_messages: (await db('messages_envoyes').count())[0].count,
            total_revenue: (await db('payments').sum('amount as total'))[0].total || 0,
            
            posts_by_category: await db('posts')
                .select('category')
                .count('* as count')
                .groupBy('category'),
            
            clients_by_type: await db('clients')
                .select('type')
                .count('* as count')
                .groupBy('type'),
            
            messages_by_day: await db('messages_envoyes')
                .select(db.raw('DATE(sent_at) as date'))
                .count('* as count')
                .groupByRaw('DATE(sent_at)')
                .orderBy('date', 'desc')
                .limit(30),
            
            top_posts: await db('posts')
                .orderBy('views', 'desc')
                .limit(10)
                .select('id', 'title', 'category', 'views', 'clicks'),
            
            conversion_rate: await calculateConversionRate()
        };
        
        res.json({ status: 'success', data: stats });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Heatmap des heures actives
router.get('/heatmap', async (req, res) => {
    try {
        const heatmapData = await db.raw(`
            SELECT 
                EXTRACT(DOW FROM sent_at) as day_of_week,
                EXTRACT(HOUR FROM sent_at) as hour,
                COUNT(*) as count
            FROM messages_envoyes
            GROUP BY day_of_week, hour
            ORDER BY day_of_week, hour
        `);
        
        res.json({ status: 'success', data: heatmapData.rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Export PDF
router.get('/export/pdf', async (req, res) => {
    try {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=rapport-manawa.pdf');
        
        doc.pipe(res);
        
        // En-tête
        doc.fontSize(24).text('MANAWA TECHS', { align: 'center' });
        doc.fontSize(14).text('Rapport d\'activité', { align: 'center' });
        doc.moveDown();
        
        // Données
        const stats = {
            posts: (await db('posts').count())[0].count,
            clients: (await db('clients').count())[0].count,
            messages: (await db('messages_envoyes').count())[0].count
        };
        
        doc.fontSize(12);
        doc.text(`Posts générés: ${stats.posts}`);
        doc.text(`Clients: ${stats.clients}`);
        doc.text(`Messages envoyés: ${stats.messages}`);
        doc.moveDown();
        
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`);
        doc.text(`Généré automatiquement par MANAWA TECHS Assistant`);
        
        doc.end();
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

async function calculateConversionRate() {
    const total = await db('clients').count();
    const clients = await db('clients').where('status', 'client').count();
    
    if (parseInt(total[0].count) === 0) return 0;
    return ((parseInt(clients[0].count) / parseInt(total[0].count)) * 100).toFixed(1);
}

module.exports = router;
