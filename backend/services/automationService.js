const cron = require('node-cron');
const db = require('../config/database');
const whatsappService = require('./whatsappService');
const mistralService = require('./mistralServiceSecure');

class AutomationService {
    constructor() {
        this.jobs = {};
    }

    // Démarrer tous les jobs automatisés
    startAll() {
        this.schedulePostPublication();
        this.scheduleFollowUps();
        this.scheduleDailyReport();
        this.scheduleBackup();
        console.log('🤖 Tous les jobs d\'automatisation démarrés');
    }

    // Publication programmée des posts
    schedulePostPublication() {
        this.jobs.postPublication = cron.schedule('* * * * *', async () => {
            const now = new Date();
            
            const scheduledPosts = await db('scheduled_posts')
                .join('posts', 'scheduled_posts.post_id', 'posts.id')
                .where('scheduled_posts.status', 'pending')
                .where('scheduled_posts.scheduled_at', '<=', now)
                .select('scheduled_posts.*', 'posts.content', 'posts.title');

            for (const post of scheduledPosts) {
                try {
                    // Envoyer sur WhatsApp
                    await whatsappService.sendMessage('2250797969475', post.content);
                    
                    await db('scheduled_posts')
                        .where('id', post.id)
                        .update({ status: 'sent', sent_at: now });
                    
                    await db('posts')
                        .where('id', post.post_id)
                        .update({ status: 'published', published_at: now });
                    
                    console.log(`✅ Post ${post.id} publié`);
                } catch (error) {
                    await db('scheduled_posts')
                        .where('id', post.id)
                        .update({ status: 'failed', error_message: error.message });
                    console.error(`❌ Erreur publication post ${post.id}:`, error.message);
                }
            }
        });
    }

    // Relances automatiques
    scheduleFollowUps() {
        this.jobs.followUps = cron.schedule('0 */6 * * *', async () => {
            const campaigns = await db('campaigns').where('status', 'active');
            
            for (const campaign of campaigns) {
                const messages = await db('messages_envoyes')
                    .where('campaign_id', campaign.id)
                    .where('status', 'sent')
                    .whereNull('response')
                    .whereRaw('sent_at <= NOW() - INTERVAL \'? hours\'', [campaign.delay_hours]);

                const followUps = JSON.parse(campaign.follow_up_messages || '[]');
                
                for (const message of messages) {
                    const client = await db('clients').where('id', message.client_id).first();
                    if (client && followUps.length > 0) {
                        await whatsappService.sendMessage(client.phone, followUps[0]);
                        await db('messages_envoyes').insert({
                            client_id: client.id,
                            campaign_id: campaign.id,
                            content: followUps[0],
                            type: 'follow_up',
                            sent_at: new Date()
                        });
                    }
                }
            }
        });
    }

    // Rapport quotidien
    scheduleDailyReport() {
        this.jobs.dailyReport = cron.schedule('0 20 * * *', async () => {
            const stats = await this.generateDailyReport();
            console.log('📊 Rapport quotidien généré:', stats);
        });
    }

    async generateDailyReport() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const [postsCount, clientsCount, messagesCount] = await Promise.all([
            db('posts').where('created_at', '>=', today).count(),
            db('clients').where('first_contact', '>=', today).count(),
            db('messages_envoyes').where('sent_at', '>=', today).count()
        ]);

        return {
            date: today,
            new_posts: parseInt(postsCount[0].count),
            new_clients: parseInt(clientsCount[0].count),
            messages_sent: parseInt(messagesCount[0].count)
        };
    }

    // Sauvegarde automatique
    scheduleBackup() {
        this.jobs.backup = cron.schedule('0 0 * * *', async () => {
            const { exec } = require('child_process');
            const backupFile = `backup-${new Date().toISOString().split('T')[0]}.sql`;
            
            exec(`pg_dump ${process.env.DB_NAME} > ./backups/${backupFile}`, (error) => {
                if (error) console.error('❌ Erreur backup:', error);
                else console.log('✅ Backup créé:', backupFile);
            });
        });
    }

    // Arrêter tous les jobs
    stopAll() {
        Object.values(this.jobs).forEach(job => job.stop());
        console.log('🛑 Tous les jobs arrêtés');
    }
}

module.exports = new AutomationService();
