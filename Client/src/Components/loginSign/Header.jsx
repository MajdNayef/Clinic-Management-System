import React from 'react';

import MedconnectLogo from '../Assets/MedconnectLogo.png';

const Header = () => {
    return (

        <header className="navbar">
            {/* Logo */}
            <div className="logo">
                <img src={MedconnectLogo} alt="MedConnect Logo" />
            </div>
            <h1>MedConnect</h1>

            {/* Navigation Links */}
            <nav className="nav-links">
                    <a href="#" className="text-gray-700 hover:text-blue-500">Home</a>
                <a href="#" className="text-gray-700 hover:text-blue-500">About Us</a>
                <a href="#" className="text-gray-700 hover:text-blue-500">Contact</a>
            </nav>

            {/* Language Selector */}
            <div className="language-selector">
                <select>
                    <option>English</option>
                    <option>العربية</option>
                </select>
            </div>

        </header>

    );
};

export default Header;
