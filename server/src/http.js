export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const bad = (m) => new HttpError(400, m);
export const notFound = (m = 'Not found') => new HttpError(404, m);
/** Wrap async route handlers. */
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).then((r) => {
  if (r !== undefined && !res.headersSent) res.json(r);
}).catch(next);
export const today = () => new Date().toISOString().slice(0, 10);
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
