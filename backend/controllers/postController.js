const db = require('../config/database');
const mistralService = require('../services/mistralService');
const Joi = require('joi');

class PostController {
    
    static postSchema = Joi.object({
        domaine: Joi.string().required(),
        type: Joi.string().valid('expertise', 'promo', 'temoignage').default('expertise'),
        instructions: Joi.string().allow('', null).max(500),
        titre: Joi.string().max(255),
        contenu: Joi.string(),
        categorie: Joi.string(),
        statut: Joi.string().valid('brouillon', 'planifie', 'publie', 'archive')
    });

    async getAllPosts(req, res) {
        try {
            const { categorie, statut, domaine, limit = 20, offset = 0 } = req.query;
            
            let query = db('posts').select('*');
            
            if (categorie) query = query.where('categorie', categorie);
            if (statut) query = query.where('statut', statut);
            if (domaine) query = query.where('domaine', domaine);
            
            const posts = await query
                .orderBy('date_creation', 'desc')
                .limit(parseInt(limit))
                .offset(parseInt(offset));
            
            const total = await db('posts').count('id as count').first();
            
            res.json({
                status: 'success',
                data: posts,
                pagination: {
                    total: parseInt(total.count),
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération des posts'
            });
        }
    }

    async getPostById(req, res) {
        try {
            const post = await db('posts').where('id', req.params.id).first();
            
            if (!post) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Post non trouvé'
                });
            }
            
            res.json({ status: 'success', data: post });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération du post'
            });
        }
    }

    async generatePost(req, res) {
        try {
            const { error, value } = PostController.postSchema.validate(req.body);
            if (error) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Données invalides',
                    details: error.details
                });
            }

            const { domaine, type, instructions } = value;
            const contenuGenere = await mistralService.generatePost(domaine, type, instructions);

            const [nouveauPost] = await db('posts')
                .insert({
                    titre: `Post ${type} - ${domaine}`,
                    contenu: contenuGenere,
                    categorie: type,
                    domaine: domaine,
                    statut: 'brouillon',
                    date_creation: new Date()
                })
                .returning('*');

            res.status(201).json({
                status: 'success',
                message: 'Post généré avec succès',
                data: nouveauPost
            });
        } catch (error) {
            console.error('Generate post error:', error);
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la génération du post',
                error: error.message
            });
        }
    }

    async updatePost(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const post = await db('posts').where('id', id).first();
            if (!post) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Post non trouvé'
                });
            }

            if (updates.statut === 'publie' && post.statut !== 'publie') {
                updates.date_publication = new Date();
            }

            const [updatedPost] = await db('posts')
                .where('id', id)
                .update(updates)
                .returning('*');

            res.json({
                status: 'success',
                message: 'Post mis à jour',
                data: updatedPost
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la mise à jour du post'
            });
        }
    }

    async deletePost(req, res) {
        try {
            const { id } = req.params;
            const deleted = await db('posts').where('id', id).del();
            
            if (!deleted) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Post non trouvé'
                });
            }

            res.json({
                status: 'success',
                message: 'Post supprimé'
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la suppression du post'
            });
        }
    }

    async getPostStats(req, res) {
        try {
            const stats = await db('posts')
                .select('domaine')
                .count('* as count')
                .groupBy('domaine');

            const byStatus = await db('posts')
                .select('statut')
                .count('* as count')
                .groupBy('statut');

            res.json({
                status: 'success',
                data: {
                    byDomaine: stats,
                    byStatus: byStatus
                }
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: 'Erreur lors de la récupération des statistiques'
            });
        }
    }
}

module.exports = new PostController();
