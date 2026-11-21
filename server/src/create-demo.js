// Create (or rebuild) the "demo" clinic with sample patients, appointments, insurance, claims and payments.
// Usage: node src/create-demo.js        → clinic address demo.<BASE_DOMAIN>, logins admin/drkhan/frontdesk/billing, password smileos123
import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { CONTROL_DB, closeAll } from './db.js';
import { migrateControlDb } from './migrations.js';
import { cq, provisionTenant, forgetTenant } from './tenancy.js';

await migrateControlDb(CONTROL_DB);
let t = (await cq("SELECT * FROM tenant WHERE slug='demo'"))[0];
if (!t) {
  await provisionTenant({ slug: 'demo', name: 'SmileOS Demo Dental', adminEmail: null, plan: 'demo' });
  t = (await cq("SELECT * FROM tenant WHERE slug='demo'"))[0];
} else if (t.status !== 'active') await cq("UPDATE tenant SET status='active' WHERE id=?", [t.id]);
forgetTenant('demo');
await closeAll();
const seed = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'db', 'seed.js');
execFileSync(process.execPath, [seed], { stdio: 'inherit', env: { ...process.env, DB_NAME: t.db_name } });
console.log(`Demo clinic ready: open ${process.env.BASE_DOMAIN ? `https://${process.env.BASE_DOMAIN}` : 'http://localhost:4000'} and enter clinic code "demo"`);
