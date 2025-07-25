import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import Header from './Header';
import userIcon from '../Assets/community.png';
import './style.css';

axios.defaults.baseURL =
    process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DASHBOARD_PATH = {
    Doctor: '/DoctorDashboard',
    Patient: '/PatientDashboard',
    Admin: '/AdminDashboard',
    Pharmacist: '/PharmacistDashboard',
};

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');

    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleChange = e =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await axios.post('/api/auth/login', form);
            localStorage.setItem('token', data.token);

            const { role } = jwtDecode(data.token);
            navigate(DASHBOARD_PATH[role] ?? '/');

        } catch (err) {
            const msg =
                err.response?.data?.message ||
                err.response?.data?.errors?.[0]?.msg ||
                t('auth.emailOrPasswordIncorrect');
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async e => {
        e.preventDefault();
        setResetMessage('');
        try {
            await axios.post('/api/auth/forgot-password', { email: resetEmail });
            setResetMessage(t('auth.resetLinkSent'));
        } catch (err) {
            setResetMessage(t('auth.resetLinkFailed'));
        }
    };

    return (
        <div>
            <Header />

            <form className="FormContainer" onSubmit={handleSubmit}>
                <div className="header">
                    <div className="text">{t('auth.welcomeBack')}</div>
                    <br />
                    <div className="text">{t('auth.loginToAccount')}</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    <label>{t('auth.enterEmail')}</label>
                    <div className="input">
                        <input
                            type="email"
                            name="email"
                            placeholder={t('auth.emailPlaceholder')}
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <label>{t('auth.enterPassword')}</label>
                    <div className="input">
                        <input
                            type="password"
                            name="password"
                            placeholder={t('auth.passwordPlaceholder')}
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <a href="#" title="Forget your password?" onClick={() => setShowOverlay(true)}>
                        {t('auth.forgotPassword')}
                    </a>
                    <br />

                    {error && <p className="error">{error}</p>}

                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? t('auth.signingIn') : t('common.login')}
                    </button>
                </div>
            </form>

            <img src={userIcon} alt="Icon" id="bottomRightIcon" />

            {showOverlay && (
                <div className="overlay">
                    <form className="overlay-content" onSubmit={handleResetPassword}>
                                        <div className="overlay-header">
                    <button className="close-button" onClick={() => setShowOverlay(false)}>
                        &times;
                    </button>
                </div>
                <h2>{t('auth.resetPassword')}</h2>
                <label>{t('auth.enterEmail')}</label>
                <div className="input">
                    <input
                        type="email"
                        name="resetEmail"
                        placeholder={t('auth.emailPlaceholder')}
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        required
                    />
                </div>
                <button className="signup-button" type="submit">
                    {t('auth.sendResetLink')}
                </button>
                        {resetMessage && <p className="message">{resetMessage}</p>}
                    </form>
                </div>

            )}
        </div>
    );
};

export default Login;
