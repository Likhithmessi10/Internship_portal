// Feature flags — controlled via .env (VITE_MONETARY_ENABLED=true/false).
// Default is false (non-monetary / learning internship mode).

export const MONETARY_ENABLED = import.meta.env.VITE_MONETARY_ENABLED === 'true';
