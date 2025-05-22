import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

import Header from './Header';
import userIcon from '../Assets/community.png';
import './style.css';

axios.defaults.baseURL =
    process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DASHBOARD_PATH = {
    Doctor: '/DoctorDashboard',
    Patient: '/PatientDashboard',
};

const Login = () => {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
                'Email or password is incorrect';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Header />

            <form className="FormContainer" onSubmit={handleSubmit}>
                <div className="header">
                    <div className="text">Welcome Back</div>
                    <br />
                    <div className="text">Login to your account</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    <label>Enter your email</label>
                    <div className="input">
                        <input
                            type="email"
                            name="email"
                            placeholder="example@gmail.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                        />
                    </div>

                    <label>Enter your password</label>
                    <div className="input">
                        <input
                            type="password"
                            name="password"
                            placeholder="******"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <a href="#" title="Forget your password?">
                        Forgot password?
                    </a>
                    <br />

                    {error && <p className="error">{error}</p>}

                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Login'}
                    </button>
                </div>
            </form>

            <img src={userIcon} alt="Icon" id="bottomRightIcon" />
        </div>
    );
};

export default Login;
