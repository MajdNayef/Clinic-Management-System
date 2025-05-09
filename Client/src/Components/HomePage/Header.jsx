import React from 'react';

import dmcIcon from '../Assets/DMC.png';

const Header = () => {
    return (
        <header className="navbar">
            {/* Logo */}
            <div className="logo">
                <img src={dmcIcon} alt="DMC Logo" />
            </div>

            {/* Navigation Links */}
            <nav className="nav-links">
                <a href="#" className="text-gray-700 hover:text-blue-500">Home</a>
                <a href="#" className="text-gray-700 hover:text-blue-500">About Us</a>
                <a href="#" className="text-gray-700 hover:text-blue-500">Contact</a>
            </nav>

            <button className='hlogin-button'>Login</button>

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
