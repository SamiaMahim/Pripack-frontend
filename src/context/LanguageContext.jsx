import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('siteLanguage') || 'en');

  useEffect(() => {
    localStorage.setItem('siteLanguage', language);
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'bn' : 'en'));

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};

// Returns obj[field + 'Bn'] when Bangla is active and non-empty, else falls back to obj[field].
export const pickField = (obj, field, language) => {
  if (!obj) return '';
  if (language === 'bn') {
    const bnValue = obj[`${field}Bn`];
    if (bnValue) return bnValue;
  }
  return obj[field] || '';
};
