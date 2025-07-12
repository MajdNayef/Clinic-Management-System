import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import Header from './Header';
import AddUser from '../Assets/adduser.png';
import alarmIcon from '../Assets/alarm.svg';
import './style.css';

const Signup = () => {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        address: '',
        email: '',
        password: '',
        confirm_password: '',
        notifications_enabled: false,
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = e =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleCheckbox = e =>
        setForm({ ...form, notifications_enabled: e.target.checked });

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('http://localhost:5000/api/auth/register', form);
            navigate('/login'); // or navigate('/dashboard') if you auto-login
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div>
            <Header />

            <form className="FormContainer" onSubmit={handleSubmit}>
                <div className="header">
                    <div className="text">{t('signup.welcome')}</div>
                    <br />
                    <div className="text">{t('signup.title')}</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    {/* first / last name */}
                    <div className="input-row">
                        <div className="input-group">
                            <label>{t('signup.firstNameLabel')}</label>
                            <div className="input">
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder={t('signup.firstNamePlaceholder')}
                                    value={form.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>{t('signup.lastNameLabel')}</label>
                            <div className="input">
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder={t('signup.lastNamePlaceholder')}
                                    value={form.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* phone */}
                    <label>{t('signup.phoneLabel')}</label>
                    <div className="input">
                        <input
                            type="text"
                            name="phone_number"
                            placeholder={t('signup.phonePlaceholder')}
                            value={form.phone_number}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* address */}
                    <label>{t('signup.addressLabel')}</label>
                    <div className="input">
                        <input
                            type="text"
                            name="address"
                            placeholder={t('signup.addressPlaceholder')}
                            value={form.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* email */}
                    <label>{t('signup.emailLabel')}</label>
                    <div className="input">
                        <input
                            type="email"
                            name="email"
                            placeholder={t('signup.emailPlaceholder')}
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* password + confirm */}
                    <div className="input-row">
                        <div className="input-group">
                            <label>{t('signup.passwordLabel')}</label>
                            <div className="input">
                                <input
                                    type="password"
                                    name="password"
                                    placeholder={t('signup.passwordPlaceholder')}
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>{t('signup.confirmPasswordLabel')}</label>
                            <div className="input">
                                <input
                                    type="password"
                                    name="confirm_password"
                                    placeholder={t('signup.confirmPasswordPlaceholder')}
                                    value={form.confirm_password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* checkbox */}
                    <div className="checkbox">
                        <input
                            type="checkbox"
                            checked={form.notifications_enabled}
                            onChange={handleCheckbox}
                        />
                        <label>{t('signup.emailNotifications')}</label>
                        <img src={alarmIcon} alt="Alarm" id="alarmIcon" />
                    </div>

                    {error && <p className="error">{t(error)}</p>}

                    <button className="signup-button" type="submit">{t('signup.button')}</button>
                </div>
            </form>

            <img src={AddUser} alt="Icon" id="bottomRightIcon" />
        </div>
    );
};

export default Signup;
