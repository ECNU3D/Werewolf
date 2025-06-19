import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, LANGUAGE_NAMES, translations } from '../constants/languages';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Initialize language from localStorage or default to Chinese
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('werewolf-language');
    return savedLanguage || LANGUAGES.CHINESE;
  });

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('werewolf-language', currentLanguage);
  }, [currentLanguage]);

  // Get translation function
  const t = (key, interpolations = {}) => {
    const keys = key.split('.');
    let value = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" not found for language "${currentLanguage}"`);
      return key;
    }

    // Handle interpolation (e.g., {{id}}, {{text}})
    let result = value;
    Object.entries(interpolations).forEach(([placeholder, replacement]) => {
      result = result.replace(new RegExp(`{{${placeholder}}}`, 'g'), replacement);
    });

    return result;
  };

  // Get role name translation
  const tr = (role) => {
    return translations[currentLanguage]?.roles?.[role] || role;
  };

  // Get phase name translation
  const tp = (phase) => {
    return translations[currentLanguage]?.phases?.[phase] || phase;
  };

  // Switch language
  const switchLanguage = (language) => {
    if (Object.values(LANGUAGES).includes(language)) {
      setCurrentLanguage(language);
    }
  };

  const value = {
    currentLanguage,
    availableLanguages: LANGUAGES,
    languageNames: LANGUAGE_NAMES,
    switchLanguage,
    t,      // General translation function
    tr,     // Role translation function
    tp,     // Phase translation function
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}; 