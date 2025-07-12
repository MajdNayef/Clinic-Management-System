import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MedconnectLogo from '../Assets/MedconnectLogo.png';
import LanguageSelector from '../CommonPages/LanguageSelector';

export default function Header() {
  const { t } = useTranslation();
    
    return (

        <header className="navbar">
            {/* Logo */}
            <div className="logo">
                <img src={MedconnectLogo} alt="MedConnect Logo" />
            </div>
            <h1>MedConnect</h1>

            {/* Navigation Links */}
            <nav className="nav-links">
                <a href="/" className="text-gray-700 hover:text-blue-500">{t('header.home')}</a>
                <a href="/Guestabout" className="text-gray-700 hover:text-blue-500">{t('common.aboutUs')}</a>
                <a href="/GuestContactUs" className="text-gray-700 hover:text-blue-500">{t('common.contactUs')}</a>
            </nav>


            {/* Language Selector */}
            <LanguageSelector />

        </header>

    );
};
