import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

// ── Google Translate element helpers ─────────────────────────────────────────

const GOOGLE_TRANSLATE_ID = 'google_translate_element';
const SCRIPT_ID = 'google-translate-script';

function injectGoogleTranslate() {
    if (document.getElementById(SCRIPT_ID)) return;

    // Hidden container Google Translate requires
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
            {
                pageLanguage: 'en',
                includedLanguages: 'te',
                autoDisplay: false,
            },
            GOOGLE_TRANSLATE_ID
        );
    };

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.head.appendChild(script);
}

function setGoogleTranslateCookie(langCode) {
    // Google Translate reads the googtrans cookie: /en/te or /en/en
    const value = langCode === 'te' ? '/en/te' : '/en/en';
    // Set on current domain and root path
    document.cookie = `googtrans=${value};path=/`;
    document.cookie = `googtrans=${value};domain=${window.location.hostname};path=/`;
}

function triggerGoogleTranslate(langCode) {
    setGoogleTranslateCookie(langCode);

    if (langCode === 'en') {
        // Restore original language
        const iframe = document.querySelector('.goog-te-banner-frame') ||
                       document.querySelector('#:1.container');
        if (iframe) {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            const restore = doc?.querySelector('.goog-te-button button');
            if (restore) { restore.click(); return; }
        }
        // Fallback: reload without googtrans so page resets
        const url = new URL(window.location.href);
        url.searchParams.delete('_x_tr_sl');
        // Remove cookie and reload
        document.cookie = 'googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = `googtrans=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=${window.location.hostname};path=/`;
        window.location.reload();
        return;
    }

    // Select Telugu in the hidden Google widget
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

// ── Provider ──────────────────────────────────────────────────────────────────

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

    // Inject Google Translate script once on mount
    useEffect(() => {
        injectGoogleTranslate();
    }, []);

    // Apply saved language preference on mount (after script loads)
    useEffect(() => {
        if (lang === 'te') {
            const timer = setTimeout(() => triggerGoogleTranslate('te'), 1500);
            return () => clearTimeout(timer);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only on mount

    const toggleLanguage = useCallback(() => {
        const next = lang === 'en' ? 'te' : 'en';
        setLang(next);
        localStorage.setItem('lang', next);
        triggerGoogleTranslate(next);
    }, [lang]);

    // Minimal t() kept for any legacy usage — returns key as-is so nothing breaks
    const t = useCallback((key) => key, []);

    return (
        <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
