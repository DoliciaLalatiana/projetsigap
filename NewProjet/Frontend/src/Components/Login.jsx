import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, Eye, EyeOff, MapPin, Key } from 'lucide-react';
import ForgotPassword from './ForgotPassword';

const Login = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('https://sigap-backend2.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLogin(data.user);
            } else {
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);
                setError(data.message || 'Erreur de connexion');
            }
        } catch (error) {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 bg-grid-black/[0.02]"></div>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 w-full max-w-md relative z-10 transform hover:scale-[1.02] transition-all duration-300">
                {/* Header */}
                <div className="text-center bg-transparent mb-8">
                    <div className="relative inline-block mb-4">
                        <div className="bg-gradient-to-br from-gray-600 to-gray-700 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-2xl relative">
                            <MapPin className="text-white w-10 h-10" />
                            <div className="absolute -top-1 -right-1 bg-gray-500 rounded-full p-1 shadow-lg">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full p-1 shadow-lg">
                            <LogIn className="text-white w-4 h-4" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent mb-2">
                        SIGAP
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Système d'Information Géographique Avancé
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center space-x-3 animate-shake">
                            <AlertCircle className="text-gray-700 w-5 h-5 flex-shrink-0" />
                            <div>
                                <span className="text-gray-800 text-sm font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        {/* Username Field */}
                        <div className="group">
                            <label className="text-gray-800 text-sm font-medium mb-2 block">Nom d'utilisateur</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-gray-900 transition-colors">
                                    <User className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all duration-200"
                                    placeholder="Entrez votre nom d'utilisateur"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="group">
                            <label className="text-gray-800 text-sm font-medium mb-2 block">Mot de passe</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-gray-900 transition-colors">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="block w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition-all duration-200"
                                    placeholder="Entrez votre mot de passe"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-800 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message mot de passe */}
                    {error && (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-center space-x-2 animate-shake">
                            <AlertCircle className="text-gray-700 w-5 h-5 flex-shrink-0" />
                            <div>
                                {attempts >= 1 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        className="block text-gray-700 text-xs underline mt-1 hover:text-black transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-4 rounded-xl font-semibold shadow-lg hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Connexion...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center space-x-2">
                                <LogIn className="w-5 h-5" />
                                <span>Se connecter</span>
                            </div>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-xs">
                        Plateforme sécurisée • Ministère de l'Aménagement du Territoire
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <ForgotPassword
                    onClose={() => setShowForgotPassword(false)}
                />
            )}
        </div>
    );
};

export default Login;