const db = require('../config/database');
const Joi = require('joi');

class ClientController {
    
    static clientSchema = Joi.object({
        nom: Joi.string().required(),
        prenom: Joi.string().allow('', null),
        entreprise: Joi.string().allow('', null),
        telephone: Joi.string().required(),
        email: Joi.string().email().allow('', null),
        type_client: Joi.string().valid('particulier', 'pme', 'commercant', 'ecole', 'entreprise').required(),
        secteur_activite: Joi.string().allow('', null),
        interets: Joi.string().allow('', null),
        notes: Joi.string().allow('', null)
    });

    async getAllClients(req, res) {
        try {
            const { type_client, statut, search } = req.query;
            
            let query = db('clients').select('*');
            
            if (type_client) query = query.where('type_client', type_client);
            if (statut) query = query.where('statut', statut);
            if (search) {
                query = query.where(function() {
                    this.where('nom', 'ilike', `%${search}%`)
                        .orWhere('prenom', 'ilike', `%${search}%`)
                        .orWhere('telephone', 'ilike', `%${search}%`)
                        .orWhere('entreprise', 'ilike', `%${search}%`);
                });
            }
            
            const clients = await query.orderBy('date_premier_contact', 'desc');
            
            res.json({
                status: 'success',
                data: clients
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération des clients'
            });
        }
    }

    async getClientById(req, res) {
        try {
            const client = await db('clients').where('id', req.params.id).first();
            
            if (!client) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Client non trouvé'
                });
            }
            
            res.json({ status: 'success', data: client });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération du client'
            });
        }
    }

    async createClient(req, res) {
        try {
            const { error, value } = ClientController.clientSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Données invalides',
                    details: error.details
                });
            }

            const [nouveauClient] = await db('clients')
                .insert({
                    ...value,
                    date_premier_contact: new Date()
                })
                .returning('*');

            res.status(201).json({
                status: 'success',
                message: 'Client ajouté avec succès',
                data: nouveauClient
            });
        } catch (error) {
            if (error.code === '23505') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Ce numéro de téléphone existe déjà'
                });
            }
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la création du client'
            });
        }
    }

    async updateClient(req, res) {
        try {
            const { id } = req.params;
            
            const client = await db('clients').where('id', id).first();
            if (!client) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Client non trouvé'
                });
            }

            const [updatedClient] = await db('clients')
                .where('id', id)
                .update(req.body)
                .returning('*');

            res.json({
                status: 'success',
                message: 'Client mis à jour',
                data: updatedClient
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la mise à jour du client'
            });
        }
    }

    async deleteClient(req, res) {
        try {
            const { id } = req.params;
            const deleted = await db('clients').where('id', id).del();
            
            if (!deleted) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Client non trouvé'
                });
            }

            res.json({
                status: 'success',
                message: 'Client supprimé'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la suppression du client'
            });
        }
    }
}

module.exports = new ClientController();
