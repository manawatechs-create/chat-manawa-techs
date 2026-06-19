const db = require('../config/database');
const mistralService = require('../services/mistralService');

class ProspectionController {
    
    async generateMessage(req, res) {
        try {
            const { client_id, service, type_message } = req.body;
            
            if (!service) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Le service est requis'
                });
            }

            let clientData = null;
            if (client_id) {
                clientData = await db('clients').where('id', client_id).first();
                if (!clientData) {
                    return res.status(404).json({
                        status: 'error',
                        message: 'Client non trouvé'
                    });
                }
            }

            const message = await mistralService.generateProspectionMessage(clientData, service);

            // Sauvegarder le message
            if (client_id) {
                await db('messages_envoyes').insert({
                    client_id: client_id,
                    contenu: message,
                    type_message: type_message || 'prospection',
                    date_envoi: new Date()
                });
            }

            res.json({
                status: 'success',
                data: {
                    message: message,
                    client_id: client_id
                }
            });
        } catch (error) {
            console.error('Generate prospection error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la génération du message'
            });
        }
    }

    async generateSalesScript(req, res) {
        try {
            const { produit } = req.body;
            
            if (!produit) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Le produit est requis'
                });
            }

            const script = await mistralService.generateSalesScript(produit);

            res.json({
                status: 'success',
                data: {
                    script: script,
                    produit: produit
                }
            });
        } catch (error) {
            console.error('Generate script error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la génération du script'
            });
        }
    }

    async getHistoriqueMessages(req, res) {
        try {
            const { client_id } = req.query;
            
            let query = db('messages_envoyes')
                .select(
                    'messages_envoyes.*',
                    'clients.nom',
                    'clients.prenom',
                    'clients.telephone'
                )
                .leftJoin('clients', 'messages_envoyes.client_id', 'clients.id')
                .orderBy('date_envoi', 'desc');
            
            if (client_id) {
                query = query.where('messages_envoyes.client_id', client_id);
            }
            
            const messages = await query;
            
            res.json({
                status: 'success',
                data: messages
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération des messages'
            });
        }
    }
}

module.exports = new ProspectionController();
