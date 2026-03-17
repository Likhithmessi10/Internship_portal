import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        'nav.home': 'Home',
        'nav.apply': 'Apply for Internship',
        'nav.status': 'Check Status',
        'nav.dashboard': 'Dashboard',
        'nav.profile': 'My Profile',
        'nav.logout': 'Logout',
        'nav.login': 'Login',
        'nav.register': 'Register',
        'dashboard.welcome': 'Welcome back,',
        'dashboard.profile': 'Your Profile',
        'dashboard.collegeRoll': 'College Roll No.',
        'profile.title': 'Complete Your Profile',
        'profile.personal': 'Personal Details',
        'profile.academic': 'Academic Details',
        'profile.update': 'Update Profile',
        'auth.studentLogin': 'Student Login',
        'auth.createAccount': 'Create Student Account',
        'nav.studentPortal': 'Student Portal',
        'nav.student': 'Student',
        'nav.applicant': 'Applicant',
        'dashboard.browse': 'Browse Internships',
        'dashboard.actionRequired': 'Action Required: Profile Incomplete',
        'dashboard.actionDesc': 'You must complete your profile with your academic and personal details before you can apply for internships.',
        'dashboard.setupNow': 'Setup Profile Now',
        'dashboard.privileges': 'Member Privileges',
        'dashboard.certTitle': 'Govt. Certification',
        'dashboard.certDesc': 'Earn recognized certificates upon successful completion.',
        'dashboard.projectsTitle': 'Live Grid Projects',
        'dashboard.projectsDesc': 'Work on real-world power transmission data.',
        'dashboard.mentorsTitle': 'Expert Mentorship',
        'dashboard.mentorsDesc': 'Learn directly from senior APTRANSCO engineers.',
        'dashboard.journey': 'Application Journey',
        'dashboard.noApps': "You haven't applied to any internships yet.",
        'dashboard.visitInternships': 'Visit the internships tab to find opportunities.',
        'dashboard.viewDetails': 'View Details',
        'dashboard.profileGlance': 'Profile Glance',
        'dashboard.edit': 'Edit',
        'dashboard.academicSetup': 'Academic Setup',
        'dashboard.cgpa': 'CGPA',
        'dashboard.aadhaar': 'Aadhaar',
        'dashboard.constructProfile': 'Construct your profile to track metrics here.',
        'common.loading': 'Loading...',
        'common.save': 'Save Changes',
        // Add more as needed
    },
    te: {
        'nav.home': 'హోమ్',
        'nav.apply': 'ఇంటర్న్ షిప్ కోసం దరఖాస్తు',
        'nav.status': 'స్థితిని తనిఖీ చేయండి',
        'nav.dashboard': 'డాష్‌బోర్డ్',
        'nav.profile': 'నా ప్రొఫైల్',
        'nav.logout': 'లాగ్ అవుట్',
        'nav.login': 'లాగిన్',
        'nav.register': 'రిజిస్టర్',
        'dashboard.welcome': 'స్వాగతం,',
        'dashboard.profile': 'మీ ప్రొఫైల్',
        'dashboard.collegeRoll': 'కాలేజీ రోల్ నంబర్',
        'profile.title': 'మీ ప్రొఫైల్‌ను పూర్తి చేయండి',
        'profile.personal': 'వ్యక్తిగత వివరాలు',
        'profile.academic': 'విద్యా వివరాలు',
        'profile.update': 'ప్రొఫైల్‌ను అప్‌డేట్ చేయండి',
        'auth.studentLogin': 'విద్యార్థి లాగిన్',
        'auth.createAccount': 'విద్యార్థి ఖాతాను సృష్టించండి',
        'nav.studentPortal': 'విద్యార్థి పోర్టల్',
        'nav.student': 'విద్యార్థి',
        'nav.applicant': 'దరఖాస్తుదారు',
        'dashboard.browse': 'ఇంటర్న్ షిప్ ల కోసం వెతకండి',
        'dashboard.actionRequired': 'చర్య అవసరం: ప్రొఫైల్ అసంపూర్ణంగా ఉంది',
        'dashboard.actionDesc': 'మీరు ఇంటర్న్‌షిప్‌ల కోసం దరఖాస్తు చేసుకునే ముందు మీ విద్యా మరియు వ్యక్తిగత వివరాలతో మీ ప్రొఫైల్‌ను పూర్తి చేయాలి.',
        'dashboard.setupNow': 'ఇప్పుడే ప్రొఫైల్ సెటప్ చేయండి',
        'dashboard.privileges': 'సభ్యుల అధికారాలు',
        'dashboard.certTitle': 'ప్రభుత్వ ధృవీకరణ',
        'dashboard.certDesc': 'విజయవంతంగా పూర్తి చేసిన తర్వాత గుర్తింపు పొందిన సర్టిఫికేట్‌లను సంపాదించండి.',
        'dashboard.projectsTitle': 'లైవ్ గ్రిడ్ ప్రాజెక్ట్‌లు',
        'dashboard.projectsDesc': 'నిజ-ప్రపంచ విద్యుత్ ప్రసార డేటాపై పని చేయండి.',
        'dashboard.mentorsTitle': 'నిపుణుల మార్గదర్శకత్వం',
        'dashboard.mentorsDesc': 'సీనియర్ ఏపీట్రాన్స్‌కో ఇంజనీర్ల నుండి నేరుగా నేర్చుకోండి.',
        'dashboard.journey': 'దరఖాస్తు ప్రయాణం',
        'dashboard.noApps': 'మీరు ఇంకా ఎటువంటి ఇంటర్న్‌షిప్‌ల కోసం దరఖాస్తు చేయలేదు.',
        'dashboard.visitInternships': 'అవకాశాలను కనుగొనడానికి ఇంటర్న్‌షిప్ ట్యాబ్‌ను సందర్శించండి.',
        'dashboard.viewDetails': 'వివరాలను చూడండి',
        'dashboard.profileGlance': 'ప్రొఫైల్ వీక్షణ',
        'dashboard.edit': 'ఎడిట్',
        'dashboard.academicSetup': 'విద్యా వివరాలు',
        'dashboard.cgpa': 'సీజీపీఏ',
        'dashboard.aadhaar': 'ఆధార్',
        'dashboard.constructProfile': 'ఇక్కడ మెట్రిక్‌లను ట్రాక్ చేయడానికి మీ ప్రొఫైల్‌ను రూపొందించండి.',
        'common.loading': 'లోడ్ అవుతోంది...',
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
