import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { Language } from '@/lib/translations/mines';

const STORAGE_KEY = 'app-language';
const LEGACY_KEY = 'mines-game-language';

// Create a simple store for cross-component sync
let listeners: (() => void)[] = [];
const emitChange = () => listeners.forEach(l => l());

const getLanguageFromStorage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  
  // Check new key first, then legacy key, then user_preferences
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'bn') return stored;
  
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === 'en' || legacy === 'bn') {
    // Migrate to new key
    localStorage.setItem(STORAGE_KEY, legacy);
    return legacy;
  }
  
  // Check user_preferences (from Settings page)
  const prefs = localStorage.getItem('user_preferences');
  if (prefs) {
    try {
      const parsed = JSON.parse(prefs);
      if (parsed.language === 'en' || parsed.language === 'bn') {
        localStorage.setItem(STORAGE_KEY, parsed.language);
        return parsed.language;
      }
    } catch {}
  }
  
  return 'en';
};

const setLanguageToStorage = (lang: Language) => {
  localStorage.setItem(STORAGE_KEY, lang);
  
  // Also update user_preferences for Settings page sync
  const prefs = localStorage.getItem('user_preferences');
  if (prefs) {
    try {
      const parsed = JSON.parse(prefs);
      parsed.language = lang;
      localStorage.setItem('user_preferences', JSON.stringify(parsed));
    } catch {}
  } else {
    localStorage.setItem('user_preferences', JSON.stringify({ language: lang }));
  }
  
  emitChange();
};

export const useLanguage = () => {
  const language = useSyncExternalStore(
    (callback) => {
      listeners.push(callback);
      return () => {
        listeners = listeners.filter(l => l !== callback);
      };
    },
    getLanguageFromStorage,
    () => 'en' as Language
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageToStorage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    const current = getLanguageFromStorage();
    setLanguageToStorage(current === 'en' ? 'bn' : 'en');
  }, []);

  return { language, setLanguage, toggleLanguage };
};
