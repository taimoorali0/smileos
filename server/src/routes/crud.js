import { Router } from 'express';
import { q, one, setClause } from '../db.js';
import { h, notFound } from '../http.js';
import { need, audit } from '../auth.js';

/** Simple list/get/create/update/delete router for a lookup table. */
export function crud(table, fields, { order = 'id', perm = 'Setup', readPerm = null, where = '' } = {}) {
  const r = Router();
  const guardRead = readPerm ? need(readPerm) : (_q, _s, n) => n();
  r.get('/', guardRead, h(async () => q(`SELECT * FROM \`${table}\` ${where} ORDER BY ${order}`)));
  r.get('/:id', guardRead, h(async (req) => (await one(`SELECT * FROM \`${table}\` WHERE id=?`, [req.params.id])) || Promise.reject(notFound())));
  r.post('/', need(perm), h(async (req) => {
    const s = setClause(req.body, fields);
    const res = await q(`INSERT INTO \`${table}\` SET ${s.sql}`, s.params);
    await audit(req.user.id, perm, null, `${table} #${res.insertId} created`);
    return one(`SELECT * FROM \`${table}\` WHERE id=?`, [res.insertId]);
  }));
  r.put('/:id', need(perm), h(async (req) => {
    const s = setClause(req.body, fields);
    if (s.sql) await q(`UPDATE \`${table}\` SET ${s.sql} WHERE id=?`, [...s.params, req.params.id]);
    await audit(req.user.id, perm, null, `${table} #${req.params.id} edited`);
    return one(`SELECT * FROM \`${table}\` WHERE id=?`, [req.params.id]);
  }));
  r.delete('/:id', need(perm), h(async (req) => {
    await q(`DELETE FROM \`${table}\` WHERE id=?`, [req.params.id]);
    await audit(req.user.id, perm, null, `${table} #${req.params.id} deleted`);
    return { ok: true };
  }));
  return r;
}
