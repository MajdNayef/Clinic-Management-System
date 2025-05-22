import React from 'react';

import { Link, Navigate, useNavigate } from 'react-router-dom';
import dmcIcon from '../Assets/DMC.png';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header className="navbar">
            {/* Logo */}
            <div className="logo">
                <img src={dmcIcon} alt="DMC Logo" />
            </div>

            {/* Navigation Links */}
            <nav className="nav-links">
                <a href="/" className="text-gray-700 hover:text-blue-500">  Home </a>
                <a href="/about" className="text-gray-700 hover:text-blue-500"> About Us</a>
                <a href="/guestContactUs" className="text-gray-700 hover:text-blue-500">   Contact Us  </a>
            </nav>

            <button className='hlogin-button' onClick={() => navigate('/login')}>  Login </button>

            {/* Language Selector */}
            <div className="language-selector">
                <select>
                    <option>English</option>
                    <option>العربية</option>
                </select>
            </div>
        </header >
    );
};

export default Header;
