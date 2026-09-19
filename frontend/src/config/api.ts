/**
 * API and Asset Configuration
 * Supports both standalone SPA hosting (Vercel, Netlify) and monolithic FastAPI hosting
 */

// If VITE_API_URL is provided, use it as the backend base URL (e.g. https://cookie-backend.onrender.com)
// Otherwise, fall back to relative paths (proxy or same-origin)
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export function assetUrl(filename: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanFile = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${cleanBase}${cleanFile}`;
}
