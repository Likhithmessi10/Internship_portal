import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

const GOOGLE_TRANSLATE_ID = 'google_translate_element';
const SCRIPT_ID = 'google-translate-script';

function injectGoogleTranslate() {
    if (document.getElementById(SCRIPT_ID)) return;
    const el = document.getElementById(GOOGLE_TRANSLATE_ID);
    if (!el) {
        const div = document.createElement('div');
        div.id = GOOGLE_TRANSLATE_ID;
        div.style.display = 'none';
        document.body.appendChild(div);
    }
    window.googleTranslateElementInit = () => {
        // eslint-disable-next-line no-new
        new window.google.translate.TranslateElement(
            { pageLanguage: 'en', includedLanguages: 'te', autoDisplay: false },
            GOOGLE_TRANSLATE_ID
        );
    };
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
}

function setGoogleTranslateCookie(langCode) {
    const value = langCode === 'te' ? '/en/te' : '/en/en';
    document.cookie = `googtrans=${value};path=/`;
    document.cookie = `googtrans=${value};domain=${window.location.hostname};path=/`;
}

function triggerGoogleTranslate(langCode) {
    setGoogleTranslateCookie(langCode);
    if (langCode === 'en') {
        document.cookie = 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=${window.location.hostname};path=/`;
        window.location.reload();
        return;
    }
    const trySelect = (attempts = 0) => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
            return;
        }
        if (attempts < 20) setTimeout(() => trySelect(attempts + 1), 200);
    };
    trySelect();
}

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

    useEffect(() => { injectGoogleTranslate(); }, []);

    useEffect(() => {
        if (lang === 'te') {
            const timer = setTimeout(() => triggerGoogleTranslate('te'), 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleLanguage = useCallback(() => {
        const next = lang === 'en' ? 'te' : 'en';
        setLang(next);
        localStorage.setItem('lang', next);
        triggerGoogleTranslate(next);
    }, [lang]);

    const t = useCallback((key) => key, []);

    return (
        <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
