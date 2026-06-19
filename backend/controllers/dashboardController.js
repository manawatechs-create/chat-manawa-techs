const db = require('../config/database');

class DashboardController {
    
    async getStats(req, res) {
        try {
            // Statistiques globales
            const totalPosts = await db('posts').count('id as count').first();
            const postsPublies = await db('posts').where('statut', 'publie').count('id as count').first();
            const totalClients = await db('clients').count('id as count').first();
            const clientsActifs = await db('clients').where('statut', 'actif').count('id as count').first();
            const totalMessages = await db('messages_envoyes').count('id as count').first();

            // Posts récents
            const recentPosts = await db('posts')
                .select('*')
                .orderBy('date_creation', 'desc')
                .limit(5);

            // Clients récents
            const recentClients = await db('clients')
                .select('*')
                .orderBy('date_premier_contact', 'desc')
                .limit(5);

            // Posts par catégorie
            const postsByCategorie = await db('posts')
                .select('categorie')
                .count('* as count')
                .groupBy('categorie');

            // Posts par domaine
            const postsByDomaine = await db('posts')
                .select('domaine')
                .count('* as count')
                .groupBy('domaine');

            // Clients par type
            const clientsByType = await db('clients')
                .select('type_client')
                .count('* as count')
                .groupBy('type_client');

            res.json({
                status: 'success',
                data: {
                    total_posts: parseInt(totalPosts.count),
                    posts_publies: parseInt(postsPublies.count),
                    total_clients: parseInt(totalClients.count),
                    clients_actifs: parseInt(clientsActifs.count),
                    total_messages: parseInt(totalMessages.count),
                    taux_conversion: '12%', // À calculer selon votre logique
                    recent_posts: recentPosts,
                    recent_clients: recentClients,
                    posts_by_categorie: postsByCategorie,
                    posts_by_domaine: postsByDomaine,
                    clients_by_type: clientsByType
                }
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération des statistiques'
            });
        }
    }
}

module.exports = new DashboardController();
