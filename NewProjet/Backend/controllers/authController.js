const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { connection } = require('../config/database');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Username et password requis' });
            }

            const user = await User.findByUsername(username);

            if (!user) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }

            const isPasswordValid = await User.comparePassword(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'sigap_secret',
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id,
                    immatricule: user.immatricule,
                    nom_complet: user.nom_complet,
                    username: user.username,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Erreur login:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    static async requestPasswordReset(req, res) {
        try {
            const { immatricule } = req.body;

            if (!immatricule) {
                return res.status(400).json({ message: 'Immatricule requis' });
            }

            const user = await User.findByImmatricule(immatricule);

            if (!user) {
                return res.status(404).json({ message: 'Immatricule non trouvé' });
            }

            if (!['agent', 'secretaire'].includes(user.role)) {
                return res.status(403).json({ message: 'Cette fonctionnalité est réservée aux agents et secrétaires' });
            }

            const query = `
        INSERT INTO password_reset_requests (user_id, immatricule) 
        VALUES (?, ?)
      `;

            connection.query(query, [user.id, immatricule], (err) => {
                if (err) {
                    console.error('Erreur création demande reset:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }

                res.json({
                    message: 'Demande de réinitialisation envoyée. Attendez la confirmation de l\'administrateur.',
                    user: {
                        id: user.id,
                        nom_complet: user.nom_complet,
                        immatricule: user.immatricule
                    }
                });
            });
        } catch (error) {
            console.error('Erreur demande reset password:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    static async getPendingResetRequests(req, res) {
        try {
            const query = `
        SELECT prr.*, u.nom_complet, u.username, u.role 
        FROM password_reset_requests prr 
        JOIN users u ON prr.user_id = u.id 
        WHERE prr.status = 'pending'
      `;

            connection.query(query, (err, results) => {
                if (err) {
                    console.error('Erreur récupération demandes:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.json(results);
            });
        } catch (error) {
            console.error('Erreur get pending requests:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    static async approvePasswordReset(req, res) {
        try {
            const { requestId, newPassword } = req.body;

            if (!requestId || !newPassword) {
                return res.status(400).json({ message: 'ID de demande et nouveau mot de passe requis' });
            }

            const getRequestQuery = 'SELECT * FROM password_reset_requests WHERE id = ? AND status = "pending"';
            connection.query(getRequestQuery, [requestId], async (err, results) => {
                if (err) {
                    console.error('Erreur récupération demande:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }

                if (results.length === 0) {
                    return res.status(404).json({ message: 'Demande non trouvée' });
                }

                const request = results[0];

                await User.updatePassword(request.user_id, newPassword);

                const updateRequestQuery = 'UPDATE password_reset_requests SET status = "approved" WHERE id = ?';
                connection.query(updateRequestQuery, [requestId], (err) => {
                    if (err) {
                        console.error('Erreur mise à jour demande:', err);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }

                    res.json({ message: 'Mot de passe réinitialisé avec succès', newPassword });
                });
            });
        } catch (error) {
            console.error('Erreur approbation reset:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    static async invalidatePassword(req, res) {
        try {
            const { userId, tempPassword } = req.body;

            if (!userId || !tempPassword) {
                return res.status(400).json({
                    message: 'User ID et mot de passe temporaire requis'
                });
            }

            if (tempPassword.length < 8) {
                return res.status(400).json({
                    message: 'Le mot de passe temporaire doit contenir au moins 8 caractères'
                });
            }

            // Vérifier que l'utilisateur existe
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Vérifier que l'utilisateur n'est pas un admin (sécurité)
            if (user.role === 'admin') {
                return res.status(403).json({
                    message: 'Impossible d\'invalider le mot de passe d\'un administrateur'
                });
            }

            // Invalider le mot de passe
            const hashedTempPassword = await bcrypt.hash(tempPassword, 12); // Salt rounds augmentés

            return new Promise((resolve, reject) => {
                const query = 'UPDATE users SET password = ?, must_change_password = TRUE WHERE id = ?';
                connection.query(query, [hashedTempPassword, userId], (err, results) => {
                    if (err) {
                        console.error('Erreur invalidation mot de passe:', err);
                        reject(new Error('Erreur base de données'));
                    }

                    if (results.affectedRows === 0) {
                        reject(new Error('Utilisateur non trouvé'));
                    }

                    resolve({
                        message: 'Mot de passe invalidé avec succès',
                        // En production, envoyer le tempPassword par email
                        tempPassword: tempPassword
                    });
                });
            })
                .then(response => res.json(response))
                .catch(error => {
                    if (error.message === 'Utilisateur non trouvé') {
                        return res.status(404).json({ message: error.message });
                    }
                    res.status(500).json({ message: 'Erreur serveur' });
                });

        } catch (error) {
            console.error('Erreur invalidation:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

}

module.exports = AuthController;