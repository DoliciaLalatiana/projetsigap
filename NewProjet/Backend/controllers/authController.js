const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { connection } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration multer pour l'upload des photos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées!'), false);
    }
  }
});

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Username et password requis' });
            }

            // Utiliser la nouvelle méthode qui inclut les données du fokontany
            const user = await User.findByUsernameWithFokontany(username);

            if (!user) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }

            const isPasswordValid = await User.comparePassword(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Identifiants invalides' });
            }

            const token = jwt.sign(
                { 
                  id: user.id, 
                  username: user.username, 
                  role: user.role,
                  fokontany_id: user.fokontany_id 
                },
                process.env.JWT_SECRET || 'sigap_secret',
                { expiresIn: '24h' }
            );

            // Préparer les données du fokontany pour la réponse
            let fokontanyData = null;
            if (user.fokontany_coordinates) {
                fokontanyData = {
                    id: user.fokontany_id,
                    nom: user.fokontany_nom,
                    coordinates: JSON.parse(user.fokontany_coordinates),
                    centre_lat: user.fokontany_centre_lat,
                    centre_lng: user.fokontany_centre_lng
                };
            }

            res.json({
                message: 'Connexion réussie',
                token,
                user: {
                    id: user.id,
                    immatricule: user.immatricule,
                    nom_complet: user.nom_complet,
                    username: user.username,
                    role: user.role,
                    photo: user.photo,
                    fokontany_id: user.fokontany_id,
                    fokontany: fokontanyData
                }
            });
        } catch (error) {
            console.error('Erreur login:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // Nouvelle méthode pour récupérer les données utilisateur
    static async getCurrentUser(req, res) {
        try {
            const user = await User.findByIdWithFokontany(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            // Préparer les données du fokontany
            let fokontanyData = null;
            if (user.fokontany_coordinates) {
                fokontanyData = {
                    id: user.fokontany_id,
                    nom: user.fokontany_nom,
                    coordinates: JSON.parse(user.fokontany_coordinates),
                    centre_lat: user.fokontany_centre_lat,
                    centre_lng: user.fokontany_centre_lng
                };
            }

            const userResponse = {
                id: user.id,
                immatricule: user.immatricule,
                nom_complet: user.nom_complet,
                username: user.username,
                role: user.role,
                is_active: user.is_active,
                photo: user.photo,
                fokontany_id: user.fokontany_id,
                fokontany: fokontanyData
            };

            res.json(userResponse);
        } catch (error) {
            console.error('Erreur récupération utilisateur:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // Nouvelle méthode pour uploader la photo de profil
    static async uploadProfilePhoto(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'Aucun fichier uploadé' });
            }

            // Supprimer l'ancienne photo si elle existe
            const currentUser = await User.findById(req.user.id);
            if (currentUser.photo) {
                const oldPhotoPath = path.join(__dirname, '../uploads', currentUser.photo);
                if (fs.existsSync(oldPhotoPath)) {
                    fs.unlinkSync(oldPhotoPath);
                }
            }

            // Mettre à jour la photo dans la base de données
            const query = 'UPDATE users SET photo = ? WHERE id = ?';
            connection.query(query, [req.file.filename, req.user.id], (err) => {
                if (err) {
                    console.error('Erreur mise à jour photo:', err);
                    return res.status(500).json({ message: 'Erreur mise à jour photo' });
                }

                res.json({
                    message: 'Photo de profil mise à jour avec succès',
                    photo: req.file.filename
                });
            });
        } catch (error) {
            console.error('Erreur upload photo:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    }

    // Nouvelle méthode pour changer le mot de passe (avec approbation admin)
    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
            }

            // Vérifier l'ancien mot de passe
            const user = await User.findByIdWithPassword(userId);
            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            const isOldPasswordValid = await User.comparePassword(oldPassword, user.password);
            if (!isOldPasswordValid) {
                return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
            }

            // Créer une demande de changement de mot de passe
            const query = `
                INSERT INTO password_change_requests (user_id, new_password_hash, status) 
                VALUES (?, ?, 'pending')
            `;
            
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            
            connection.query(query, [userId, newPasswordHash], (err) => {
                if (err) {
                    console.error('Erreur création demande changement:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }

                res.json({
                    message: 'Demande de changement de mot de passe envoyée. Attendez l\'approbation de l\'administrateur.'
                });
            });
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
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
                        immatricule: user.immatricule,
                        username: user.username
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

    // Nouvelle méthode pour récupérer les demandes de changement de mot de passe
    static async getPendingPasswordChangeRequests(req, res) {
        try {
            const query = `
                SELECT pcr.*, u.nom_complet, u.username, u.role, u.immatricule
                FROM password_change_requests pcr 
                JOIN users u ON pcr.user_id = u.id 
                WHERE pcr.status = 'pending'
            `;

            connection.query(query, (err, results) => {
                if (err) {
                    console.error('Erreur récupération demandes changement:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }
                res.json(results);
            });
        } catch (error) {
            console.error('Erreur get pending change requests:', error);
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

    // Nouvelle méthode pour approuver le changement de mot de passe
    static async approvePasswordChange(req, res) {
        try {
            const { requestId } = req.body;

            if (!requestId) {
                return res.status(400).json({ message: 'ID de demande requis' });
            }

            const getRequestQuery = 'SELECT * FROM password_change_requests WHERE id = ? AND status = "pending"';
            connection.query(getRequestQuery, [requestId], async (err, results) => {
                if (err) {
                    console.error('Erreur récupération demande changement:', err);
                    return res.status(500).json({ message: 'Erreur serveur' });
                }

                if (results.length === 0) {
                    return res.status(404).json({ message: 'Demande non trouvée' });
                }

                const request = results[0];

                // Mettre à jour le mot de passe directement avec le hash stocké
                const updatePasswordQuery = 'UPDATE users SET password = ? WHERE id = ?';
                connection.query(updatePasswordQuery, [request.new_password_hash, request.user_id], (err) => {
                    if (err) {
                        console.error('Erreur mise à jour mot de passe:', err);
                        return res.status(500).json({ message: 'Erreur serveur' });
                    }

                    // Marquer la demande comme approuvée
                    const updateRequestQuery = 'UPDATE password_change_requests SET status = "approved" WHERE id = ?';
                    connection.query(updateRequestQuery, [requestId], (err) => {
                        if (err) {
                            console.error('Erreur mise à jour demande:', err);
                            return res.status(500).json({ message: 'Erreur serveur' });
                        }

                        res.json({ message: 'Changement de mot de passe approuvé avec succès' });
                    });
                });
            });
        } catch (error) {
            console.error('Erreur approbation changement:', error);
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
            const hashedTempPassword = await bcrypt.hash(tempPassword, 12);

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

module.exports = { AuthController, upload };