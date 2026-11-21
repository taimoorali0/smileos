// Fetch wrapper for the SmileOS API. Sessions use a secure httpOnly cookie set by the server;
// the X-SmileOS header proves requests come from this app (CSRF protection).
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };
// Kept for older callers; sessions are cookie-based now
export const setToken = () => {};
export const getToken = () => '';

export async function api(method, url, body, opts = {}) {
  const isForm = body instanceof FormData;
  const res = await fetch('/api' + url, {
    method,
    credentials: 'same-origin',
    headers: { 'x-smileos': '1', ...(isForm ? {} : { 'content-type': 'application/json' }), ...(opts.background ? { 'x-smileos-background': '1' } : {}) },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (res.status === 401 && !url.startsWith('/auth/') && onUnauthorized) onUnauthorized(data?.error);
  if (!res.ok) throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  return data;
}
export const get = (u) => api('GET', u);
export const post = (u, b) => api('POST', u, b || {});
export const put = (u, b) => api('PUT', u, b || {});
export const del = (u, b) => api('DELETE', u, b);

export const money = (n) => (Number(n) || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
export const fmtDate = (d) => (d ? new Date(d.length <= 10 ? d + 'T00:00:00' : d.replace(' ', 'T')).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtTime = (d) => (d ? new Date(d.replace(' ', 'T')).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '');
export const todayStr = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
export const initials = (p) => `${(p?.first_name || '?')[0]}${(p?.last_name || '')[0] || ''}`.toUpperCase();
export const PROC_STATUS = { 1: 'TP', 2: 'C', 3: 'EC', 4: 'EO', 5: 'R', 6: 'D', 7: 'Cn' };
export const PROC_STATUS_NAME = { 1: 'Treatment planned', 2: 'Complete', 3: 'Existing (this office)', 4: 'Existing (other)', 5: 'Referred', 7: 'Condition' };
export const APT_STATUS = { 1: 'Scheduled', 2: 'Complete', 3: 'Unscheduled', 5: 'Broken', 6: 'Planned' };
