// X12 5010 dental EDI: 837D claims, 270 eligibility requests, 835 remittance parsing.
// Files follow the HIPAA 5010 implementation guide layout. Validate with your clearinghouse in test mode before production.
import { q, one } from '../db.js';

const clean = (s, max = 60) => String(s ?? '').toUpperCase().replace(/[*~:^]/g, ' ').replace(/[^\x20-\x7E]/g, '').trim().slice(0, max);
const pad = (s, n) => String(s ?? '').padEnd(n, ' ').slice(0, n);
const d8 = (d) => String(d || '').slice(0, 10).replace(/-/g, '');
const amt = (n) => (Math.round(Number(n || 0) * 100) / 100).toFixed(2).replace(/\.00$/, '');
const zip = (z) => String(z || '').replace(/\D/g, '') || '000000000';
const now = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return { ymd: `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`, hm: `${p(d.getHours())}${p(d.getMinutes())}` };
};

class Builder {
  constructor() { this.segs = []; }
  add(...els) {
    while (els.length > 1 && (els[els.length - 1] === '' || els[els.length - 1] == null)) els.pop();
    this.segs.push(els.map((e) => (e == null ? '' : String(e))).join('*'));
  }
}

function envelope(cfg, gsCode, version, control, bodyFn) {
  const t = now();
  const b = new Builder();
  const ctl = String(control).padStart(9, '0');
  b.add('ISA', '00', pad('', 10), '00', pad('', 10), 'ZZ', pad(clean(cfg.sender_id, 15), 15), 'ZZ', pad(clean(cfg.receiver_id, 15), 15),
    t.ymd.slice(2), t.hm, '^', '00501', ctl, '0', cfg.test_indicator === 'P' ? 'P' : 'T', ':');
  b.add('GS', gsCode, clean(cfg.sender_id, 15), clean(cfg.receiver_id, 15), t.ymd, t.hm, String(control), 'X', version);
  const stIndex = b.segs.length;
  bodyFn(b, t);
  const count = b.segs.length - stIndex + 1;
  b.add('SE', count, '0001');
  b.add('GE', '1', String(control));
  b.add('IEA', '1', ctl);
  return b.segs.join('~\n') + '~\n';
}

/** Load everything needed to bill a claim. */
async function claimData(claimId) {
  const c = await one(`SELECT cl.*, pp.relationship, pp.ordinal, s.subscriber_num, s.subscriber_id, ip.group_num, ip.group_name, ca.name carrier, ca.payer_id,
      p.first_name p_first, p.last_name p_last, p.birthdate p_dob, p.gender p_gender, p.address p_addr, p.city p_city, p.state p_state, p.zip p_zip,
      sb.first_name s_first, sb.last_name s_last, sb.birthdate s_dob, sb.gender s_gender, sb.address s_addr, sb.city s_city, sb.state s_state, sb.zip s_zip
    FROM claim cl JOIN pat_plan pp ON pp.id=cl.pat_plan_id JOIN ins_sub s ON s.id=pp.ins_sub_id JOIN ins_plan ip ON ip.id=s.plan_id JOIN carrier ca ON ca.id=ip.carrier_id
    JOIN patient p ON p.id=cl.patient_id JOIN patient sb ON sb.id=s.subscriber_id WHERE cl.id=?`, [claimId]);
  if (!c) throw new Error(`Claim ${claimId} not found`);
  c.procs = await q(`SELECT cp.*, pc.code, pl.tooth, pl.surf, pl.proc_date, pl.prov_id, pr.first_name pr_first, pr.last_name pr_last
    FROM claim_proc cp JOIN procedure_log pl ON pl.id=cp.proc_id JOIN procedure_code pc ON pc.id=pl.code_id JOIN provider pr ON pr.id=pl.prov_id WHERE cp.claim_id=?`, [claimId]);
  return c;
}

/** Problems that would make a clearinghouse reject the claim. */
export function validateClaim(c, cfg) {
  const errs = [];
  if (!/^\d{10}$/.test(cfg.billing_npi || '')) errs.push('Billing NPI (10 digits) is missing in Setup → Integrations → Clearinghouse');
  if (!/^\d{9}$/.test(String(cfg.tax_id || '').replace(/\D/g, ''))) errs.push('Tax ID (9 digits) is missing');
  if (!cfg.billing_address || !cfg.billing_city || !cfg.billing_state || !cfg.billing_zip) errs.push('Billing address is incomplete');
  if (!c.subscriber_num) errs.push(`Claim ${c.id}: subscriber member ID is missing`);
  if (!c.payer_id) errs.push(`Claim ${c.id}: carrier ${c.carrier} has no electronic payer ID`);
  if (!c.s_dob) errs.push(`Claim ${c.id}: subscriber birthdate is missing`);
  if (!c.procs.length) errs.push(`Claim ${c.id}: no procedures`);
  return errs;
}

export async function build837(claimIds, cfg, control) {
  const claims = [];
  for (const id of claimIds) claims.push(await claimData(id));
  const errors = claims.flatMap((c) => validateClaim(c, cfg));
  const content = envelope(cfg, 'HC', '005010X224A2', control, (b, t) => {
    b.add('ST', '837', '0001', '005010X224A2');
    b.add('BHT', '0019', '00', String(control), t.ymd, t.hm, 'CH');
    b.add('NM1', '41', '2', clean(cfg.billing_name || 'DENTAL OFFICE'), '', '', '', '', '46', clean(cfg.sender_id, 80));
    b.add('PER', 'IC', clean(cfg.billing_name || 'BILLING'), 'TE', String(cfg.billing_phone || '0000000000').replace(/\D/g, ''));
    b.add('NM1', '40', '2', clean(cfg.name || 'CLEARINGHOUSE'), '', '', '', '', '46', clean(cfg.receiver_id, 80));
    let hl = 1;
    b.add('HL', String(hl), '', '20', '1');
    b.add('NM1', '85', '2', clean(cfg.billing_name || 'DENTAL OFFICE'), '', '', '', '', 'XX', cfg.billing_npi);
    b.add('N3', clean(cfg.billing_address, 55));
    b.add('N4', clean(cfg.billing_city, 30), clean(cfg.billing_state, 2), zip(cfg.billing_zip));
    b.add('REF', 'EI', String(cfg.tax_id || '').replace(/\D/g, ''));
    const billingHl = hl;
    for (const c of claims) {
      const self = c.relationship === 'Self';
      hl += 1; const subHl = hl;
      b.add('HL', String(subHl), String(billingHl), '22', self ? '0' : '1');
      b.add('SBR', c.ordinal === 1 ? 'P' : 'S', self ? '18' : '', clean(c.group_num, 50), self ? '' : clean(c.group_name, 60), '', '', '', '', 'CI');
      b.add('NM1', 'IL', '1', clean(c.s_last), clean(c.s_first, 35), '', '', '', 'MI', clean(c.subscriber_num, 80));
      if (self) {
        b.add('N3', clean(c.s_addr || 'UNKNOWN', 55));
        b.add('N4', clean(c.s_city || 'UNKNOWN', 30), clean(c.s_state || 'XX', 2), zip(c.s_zip));
        b.add('DMG', 'D8', d8(c.s_dob), c.s_gender === 'F' ? 'F' : c.s_gender === 'M' ? 'M' : 'U');
      }
      b.add('NM1', 'PR', '2', clean(c.carrier), '', '', '', '', 'PI', clean(c.payer_id, 80));
      if (!self) {
        hl += 1;
        b.add('HL', String(hl), String(subHl), '23', '0');
        b.add('PAT', { Spouse: '01', Child: '19' }[c.relationship] || 'G8');
        b.add('NM1', 'QC', '1', clean(c.p_last), clean(c.p_first, 35));
        b.add('N3', clean(c.p_addr || c.s_addr || 'UNKNOWN', 55));
        b.add('N4', clean(c.p_city || c.s_city || 'UNKNOWN', 30), clean(c.p_state || c.s_state || 'XX', 2), zip(c.p_zip || c.s_zip));
        b.add('DMG', 'D8', d8(c.p_dob), c.p_gender === 'F' ? 'F' : c.p_gender === 'M' ? 'M' : 'U');
      }
      const total = c.procs.reduce((s, p) => s + Number(p.fee_billed), 0);
      b.add('CLM', String(c.id), amt(total), '', '', '11:B:1', 'Y', 'A', 'Y', 'Y');
      b.add('DTP', '472', 'D8', d8(c.date_service));
      const prov = c.procs[0];
      const npi = cfg.provider_npis?.[prov.prov_id] || cfg.billing_npi;
      b.add('NM1', '82', '1', clean(prov.pr_last), clean(prov.pr_first, 35), '', '', '', 'XX', npi);
      b.add('PRV', 'PE', 'PXC', '1223G0001X');
      c.procs.forEach((p, i) => {
        b.add('LX', String(i + 1));
        b.add('SV3', `AD:${p.code}`, amt(p.fee_billed), '', '', '', '1');
        if (p.tooth && /^\d+$|^[A-T]$/.test(p.tooth)) b.add('TOO', 'JP', p.tooth, p.surf ? p.surf.split('').join(':') : '');
        b.add('DTP', '472', 'D8', d8(p.proc_date || c.date_service));
        b.add('REF', '6R', String(p.id));
      });
    }
  });
  return { content, errors };
}

export async function build270(patPlanId, cfg, control) {
  const r = await one(`SELECT pp.*, s.subscriber_num, sb.first_name, sb.last_name, sb.birthdate, sb.gender, ca.name carrier, ca.payer_id
    FROM pat_plan pp JOIN ins_sub s ON s.id=pp.ins_sub_id JOIN patient sb ON sb.id=s.subscriber_id JOIN ins_plan ip ON ip.id=s.plan_id JOIN carrier ca ON ca.id=ip.carrier_id WHERE pp.id=?`, [patPlanId]);
  if (!r) throw new Error('Insurance not found');
  return envelope(cfg, 'HS', '005010X279A1', control, (b, t) => {
    b.add('ST', '270', '0001', '005010X279A1');
    b.add('BHT', '0022', '13', String(control), t.ymd, t.hm);
    b.add('HL', '1', '', '20', '1');
    b.add('NM1', 'PR', '2', clean(r.carrier), '', '', '', '', 'PI', clean(r.payer_id));
    b.add('HL', '2', '1', '21', '1');
    b.add('NM1', '1P', '2', clean(cfg.billing_name || 'DENTAL OFFICE'), '', '', '', '', 'XX', cfg.billing_npi);
    b.add('HL', '3', '2', '22', '0');
    b.add('TRN', '1', String(control), '9' + String(cfg.tax_id || '000000000').replace(/\D/g, '').slice(0, 9));
    b.add('NM1', 'IL', '1', clean(r.last_name), clean(r.first_name, 35), '', '', '', 'MI', clean(r.subscriber_num));
    if (r.birthdate) b.add('DMG', 'D8', d8(r.birthdate), r.gender === 'F' ? 'F' : r.gender === 'M' ? 'M' : 'U');
    b.add('DTP', '291', 'D8', t.ymd);
    b.add('EQ', '35');
  });
}

/** Parse an 835 remittance into claims and service lines. */
export function parse835(text) {
  const raw = String(text).replace(/\r?\n/g, '');
  if (!raw.startsWith('ISA')) throw new Error('Not an X12 file (must start with ISA)');
  const el = raw[3];
  const seg = raw[105] || '~';
  const comp = raw[104] || ':';
  const segs = raw.split(seg).map((s) => s.trim()).filter(Boolean).map((s) => s.split(el));
  const out = { payer: '', checkNumber: '', paymentDate: '', totalPaid: 0, claims: [] };
  let claim = null; let svc = null;
  for (const s of segs) {
    const id = s[0];
    if (id === 'BPR') { out.totalPaid = Number(s[2] || 0); out.paymentDate = s[16] || ''; }
    else if (id === 'TRN') out.checkNumber = s[2] || '';
    else if (id === 'N1' && s[1] === 'PR') out.payer = s[2] || '';
    else if (id === 'CLP') {
      claim = { claimId: s[1], status: s[2], charge: Number(s[3] || 0), paid: Number(s[4] || 0), patientResp: Number(s[5] || 0), payerClaimNum: s[7] || '', services: [], writeOff: 0 };
      out.claims.push(claim); svc = null;
    } else if (id === 'SVC' && claim) {
      const code = (s[1] || '').split(comp)[1] || s[1];
      svc = { code, charge: Number(s[2] || 0), paid: Number(s[3] || 0), writeOff: 0, patientResp: 0, procId: null };
      claim.services.push(svc);
    } else if (id === 'REF' && s[1] === '6R' && svc) svc.procId = Number(s[2]);
    else if (id === 'CAS' && claim) {
      // CAS*group*reason*amount*qty*reason*amount...
      for (let i = 2; i + 1 < s.length; i += 3) {
        const a = Number(s[i + 1] || 0);
        const target = svc || claim;
        if (s[1] === 'CO') target.writeOff = (target.writeOff || 0) + a;
        if (s[1] === 'PR' && svc) svc.patientResp += a;
      }
    }
  }
  return out;
}

/** Build a sample 835 for a claim (used by test mode to simulate a payer response). */
export async function sample835(claimId, cfg, control) {
  const c = await claimData(claimId);
  const paid = c.procs.reduce((s, p) => s + Number(p.ins_est), 0);
  return envelope({ ...cfg, sender_id: cfg.receiver_id, receiver_id: cfg.sender_id }, 'HP', '005010X221A1', control, (b, t) => {
    b.add('ST', '835', '0001', '005010X221A1');
    b.add('BPR', 'I', amt(paid), 'C', 'ACH', 'CCP', '01', '999999999', 'DA', '123456', '1512345678', '', '01', '999988880', 'DA', '98765', t.ymd);
    b.add('TRN', '1', `TEST${control}`, '1512345678');
    b.add('N1', 'PR', clean(c.carrier));
    b.add('N1', 'PE', clean(cfg.billing_name || 'DENTAL OFFICE'), 'XX', cfg.billing_npi || '0000000000');
    b.add('CLP', String(c.id), '1', amt(c.claim_fee), amt(paid), amt(c.procs.reduce((s, p) => s + Number(p.fee_billed) - Number(p.ins_est) - Number(p.write_off_est), 0)), '12', `PAYER${c.id}`);
    for (const p of c.procs) {
      b.add('SVC', `AD:${p.code}`, amt(p.fee_billed), amt(p.ins_est));
      if (Number(p.write_off_est)) b.add('CAS', 'CO', '45', amt(p.write_off_est));
      b.add('REF', '6R', String(p.id));
    }
  });
}
