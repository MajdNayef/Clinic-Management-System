import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import Header from './Header';
import './style.css';

const ResetPassword = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({ password: '', confirm_password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const handleChange = e =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccess('');
        const token = searchParams.get('token');
        if (!token) {
            setError(t('resetPassword.invalidToken'));
            return;
        }

        if (form.password !== form.confirm_password) {
            setError(t('resetPassword.passwordMismatch'));
            return;
        }

        try {
            await axios.post('/api/auth/reset-password', { token, password: form.password });
            setSuccess(t('resetPassword.passwordResetSuccess'));
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('resetPassword.passwordResetFailed'));
        }
    };

    return (
        <div>
            <Header />
            <form className="FormContainer" onSubmit={handleSubmit}>
                <div className="header">
                    <div className="text">{t('resetPassword.title')}</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    <label>{t('resetPassword.newPasswordLabel')}</label>
                    <div className="input">
                        <input
                            type="password"
                            name="password"
                            placeholder={t('resetPassword.newPasswordPlaceholder')}
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label>{t('resetPassword.confirmPasswordLabel')}</label>
                    <div className="input">
                        <input
                            type="password"
                            name="confirm_password"
                            placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                            value={form.confirm_password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <p className="error">{t(error)}</p>}
                    {success && <p className="success">{t(success)}</p>}

                    <button className="signup-button" type="submit">{t('resetPassword.resetButton')}</button>
                </div>
            </form>
        </div>
    );
};

export default ResetPassword;
