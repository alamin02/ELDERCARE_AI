import React, { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [textScale, setTextScale] = useState(localStorage.getItem('eldercare_text_scale') || 'normal');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('eldercare_high_contrast') === 'true');
  const [language, setLanguageState] = useState(localStorage.getItem('eldercare_lang') || 'en');

  useEffect(() => {
    // Apply text scale class to root body
    document.body.classList.remove('text-scale-large', 'text-scale-xlarge');
    if (textScale === 'large') {
      document.body.classList.add('text-scale-large');
    } else if (textScale === 'xlarge') {
      document.body.classList.add('text-scale-xlarge');
    }
    localStorage.setItem('eldercare_text_scale', textScale);
  }, [textScale]);

  useEffect(() => {
    // Apply high contrast class to root
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('eldercare_high_contrast', highContrast.toString());
  }, [highContrast]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);

  const increaseFontSize = () => {
    if (textScale === 'normal') setTextScale('large');
    else if (textScale === 'large') setTextScale('xlarge');
  };

  const decreaseFontSize = () => {
    if (textScale === 'xlarge') setTextScale('large');
    else if (textScale === 'large') setTextScale('normal');
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('eldercare_lang', lang);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        textScale,
        setTextScale,
        highContrast,
        toggleHighContrast,
        increaseFontSize,
        decreaseFontSize,
        language,
        setLanguage
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
