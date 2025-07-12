import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dmcIcon from '../Assets/DMC.png';
import LanguageSelector from '../CommonPages/LanguageSelector';

export default function Header() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <header className="navbar">
            {/* Logo */}
            <div className="logo">
                <img src={dmcIcon} alt="DMC Logo" />
            </div>

            {/* Navigation Links */}
            <nav className="nav-links">
                <a href="/" className="text-gray-700 hover:text-blue-500">{t('header.home')}</a>
                {/* <a href="/about" className="text-gray-700 hover:text-blue-500">{t('header.aboutUs')}</a> */}
                <a href="/guestContactUs" className="text-gray-700 hover:text-blue-500">{t('header.contactUs')}</a>
            </nav>

            <button className='hlogin-button' onClick={() => navigate('/login')}>{t('common.login')}</button>

            {/* Language Selector */}
            <LanguageSelector />
        </header >
    );
};
