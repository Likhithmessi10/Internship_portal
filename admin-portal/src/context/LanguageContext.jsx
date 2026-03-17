import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        'nav.dashboard': 'Admin Dashboard',
        'nav.internships': 'Manage Internships',
        'nav.applications': 'Applications',
        'nav.past': 'Past Internships',
        'nav.logout': 'Logout',
        'nav.rejected': 'Rejected Apps',
        'dashboard.stats': 'Real-time Stats',
        'dashboard.welcome': 'Welcome Back,',
        'dashboard.live': 'Live Internships',
        'dashboard.new': 'Create New Internship',
        'dashboard.title': 'Internship Title',
        'dashboard.applications': 'Applications',
        'dashboard.status': 'Status',
        'dashboard.actions': 'Actions',
        'dashboard.view': 'View Applications',
        'common.loading': 'Loading Hub...',
        'common.save': 'Save Changes',
        // Add more as needed
    },
    te: {
        'nav.dashboard': 'అడ్మిన్ డాష్‌బోర్డ్',
        'nav.internships': 'ఇంటర్న్‌షిప్‌ల నిర్వహణ',
        'nav.applications': 'దరఖాస్తులు',
        'nav.past': 'పాత ఇంటర్న్‌షిప్‌లు',
        'nav.logout': 'లాగ్ అవుట్',
        'nav.rejected': 'తిరస్కరించబడినవి',
        'dashboard.stats': 'నిజ-సమయ గణాంకాలు',
        'dashboard.welcome': 'తిరిగి స్వాగతం,',
        'dashboard.live': 'లైవ్ ఇంటర్న్‌షిప్‌లు',
        'dashboard.new': 'కొత్త ఇంటర్న్‌షిప్‌ని సృష్టించండి',
        'dashboard.title': 'ఇంటర్న్‌షిప్ టైటిల్',
        'dashboard.applications': 'దరఖాస్తులు',
        'dashboard.status': 'స్థితి',
        'dashboard.actions': 'చర్యలు',
        'dashboard.view': 'దరఖాస్తులను చూడండి',
        'common.loading': 'హబ్‌ను లోడ్ చేస్తోంది...',
        'common.save': 'మార్పులను సేవ్ చేయండి',
    }
};

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('lang') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('lang', lang);
    }, [lang]);

    const t = (key) => {
        return translations[lang][key] || key;
    };

    const toggleLanguage = () => {
        setLang(prev => prev === 'en' ? 'te' : 'en');
    };

    return (
        <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
