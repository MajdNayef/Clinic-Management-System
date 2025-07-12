import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector = ({ className = '' }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  // Always set LTR direction
  useEffect(() => {
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <div className={`language-selector ${className}`}>
      <select 
        value={i18n.language} 
        onChange={(e) => changeLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
    </div>
  );
};

export default LanguageSelector; 