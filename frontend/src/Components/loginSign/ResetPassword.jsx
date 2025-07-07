import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

import Header from './Header';
import './style.css';

const ResetPassword = () => {
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
            setError('Invalid or missing reset token.');
            return;
        }

        if (form.password !== form.confirm_password) {
            setError('Passwords do not match.');
            return;
        }

        try {
            await axios.post('/api/auth/reset-password', { token, password: form.password });
            setSuccess('Password reset successfully. Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        }
    };

    return (
        <div>
            <Header />
            <form className="FormContainer" onSubmit={handleSubmit}>
                <div className="header">
                    <div className="text">Reset Your Password</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    <label>Enter your new password</label>
                    <div className="input">
                        <input
                            type="password"
                            name="password"
                            placeholder="******"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <label>Confirm your new password</label>
                    <div className="input">
                        <input
                            type="password"
                            name="confirm_password"
                            placeholder="******"
                            value={form.confirm_password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && <p className="error">{error}</p>}
                    {success && <p className="success">{success}</p>}

                    <button className="signup-button" type="submit">
                        Reset Password
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ResetPassword;
