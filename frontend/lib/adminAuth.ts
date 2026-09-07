const tokenKey = 'sundas_admin_token';

export function getAdminToken() { return window.localStorage.getItem(tokenKey); }
export function setAdminToken(token: string) { window.localStorage.setItem(tokenKey, token); }
export function clearAdminToken() { window.localStorage.removeItem(tokenKey); }