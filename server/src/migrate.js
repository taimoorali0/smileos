// Brings the control database and every clinic database up to date.
import 'dotenv/config';
import { DEFAULT_DB, CONTROL_DB, adminConnection } from './db.js';
import { migrateClinicDb, migrateControlDb } from './migrations.js';

await migrateControlDb(CONTROL_DB);
console.log('Control database ready:', CONTROL_DB);
if (process.env.MULTI_TENANT !== '1') { await migrateClinicDb(DEFAULT_DB); console.log('Clinic database ready:', DEFAULT_DB); }
const c = await adminConnection({ database: CONTROL_DB });
const [tenants] = await c.query("SELECT db_name FROM tenant WHERE status<>'deleted'");
await c.end();
for (const t of tenants) { await migrateClinicDb(t.db_name); console.log('Clinic database ready:', t.db_name); }
