import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import Header from './Header';
import AddUser from '../Assets/adduser.png';
import alarmIcon from '../Assets/alarm.svg';
import { getApiUrl, API_ENDPOINTS } from '../../config';
import './style.css';

const Signup = () => {
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
            await axios.post(getApiUrl(API_ENDPOINTS.AUTH.REGISTER), form);
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
                    <div className="text">Welcome to DMC Community</div>
                    <br />
                    <div className="text">Sign up</div>
                    <div className="underline"></div>
                </div>

                <div className="inputs">
                    {/* first / last name */}
                    <div className="input-row">
                        <div className="input-group">
                            <label>Enter your first name</label>
                            <div className="input">
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Enter your last name</label>
                            <div className="input">
                                <input
                                    type="text"
                                    name="last_name"
                                    placeholder="Last Name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* phone */}
                    <label>Enter your phone number</label>
                    <div className="input">
                        <input
                            type="text"
                            name="phone_number"
                            placeholder="+966"
                            value={form.phone_number}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* address */}
                    <label>Enter your Address</label>
                    <div className="input">
                        <input
                            type="text"
                            name="address"
                            placeholder="Address"
                            value={form.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* email */}
                    <label>Enter your email</label>
                    <div className="input">
                        <input
                            type="email"
                            name="email"
                            placeholder="example@gmail.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* password + confirm */}
                    <div className="input-row">
                        <div className="input-group">
                            <label>Enter your password</label>
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
                        </div>

                        <div className="input-group">
                            <label>Confirm your password</label>
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
                        </div>
                    </div>

                    {/* checkbox */}
                    <div className="checkbox">
                        <input
                            type="checkbox"
                            checked={form.notifications_enabled}
                            onChange={handleCheckbox}
                        />
                        <label>I would like to receive email notifications</label>
                        <img src={alarmIcon} alt="Alarm" id="alarmIcon" />
                    </div>

                    {error && <p className="error">{error}</p>}

                    <button className="signup-button" type="submit">
                        Sign up
                    </button>
                </div>
            </form>

            <img src={AddUser} alt="Icon" id="bottomRightIcon" />
        </div>
    );
};

export default Signup;
