import firebaseConfig from '../../firebase-applet-config.json';
import type { IjopStatus, PesantrenTipe, PublicPesantren, StatusKeaktifan, SystemConfig } from '../types';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

const FIRESTORE_DB_PATH = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/${FIRESTORE_DB_PATH}/documents`;

function decodeValue(val: FirestoreValue | undefined): unknown {
  if (!val) return undefined;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) return (val.arrayValue.values || []).map((v) => decodeValue(v));
  if ('mapValue' in val) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      out[k] = decodeValue(v);
    }
    return out;
  }
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    out[k] = decodeValue(v);
  }
  return out;
}

export async function probeFirestoreRest(timeoutMs = 5000): Promise<'ok' | 'config_error' | 'unreachable'> {
  try {
    const res = await fetch(
      `${FIRESTORE_REST_BASE}:runQuery?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'public_pesantren' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'statusKeaktifan' },
                op: 'EQUAL',
                value: { stringValue: 'aktif' },
              },
            },
            limit: 1,
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (res.status === 200 || res.status === 403) {
      return 'ok';
    }
    return 'config_error';
  } catch {
    return 'unreachable';
  }
}

export async function fetchPublicSystemConfigRest(timeoutMs = 6000): Promise<SystemConfig | null> {
  try {
    const res = await fetch(
      `${FIRESTORE_REST_BASE}:batchGet?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: [`${FIRESTORE_DB_PATH}/documents/system_config/default`],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ found?: FirestoreDocument }>;
    const doc = rows.find((r) => r.found)?.found;
    if (!doc?.fields) return null;
    const raw = decodeFields(doc.fields);
    if (!raw.kabupatenNama) return null;
    return {
      kabupatenNama: String(raw.kabupatenNama || 'Kabupaten'),
      activePeriode: String(raw.activePeriode || '2025/2026'),
      allowMultiOperatorPerPesantren: Boolean(raw.allowMultiOperatorPerPesantren ?? true),
      allowMultiPesantrenPerOperator: Boolean(raw.allowMultiPesantrenPerOperator ?? true),
      allowPostApprovalEdit: Boolean(raw.allowPostApprovalEdit ?? true),
      publicDirectoryEnabled: Boolean(raw.publicDirectoryEnabled ?? true),
      updatedByUid: String(raw.updatedByUid || ''),
      updatedAt: raw.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function fetchPublicPesantrenRest(timeoutMs = 7000): Promise<PublicPesantren[] | null> {
  try {
    const res = await fetch(
      `${FIRESTORE_REST_BASE}:runQuery?key=${encodeURIComponent(firebaseConfig.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'public_pesantren' }],
            where: {
              fieldFilter: {
                field: { fieldPath: 'statusKeaktifan' },
                op: 'EQUAL',
                value: { stringValue: 'aktif' },
              },
            },
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ document?: FirestoreDocument }>;
    const list: PublicPesantren[] = [];
    for (const row of rows) {
      if (!row.document?.fields) continue;
      const id = row.document.name.split('/').pop() || '';
      const raw = decodeFields(row.document.fields);
      list.push({
        id,
        nama: String(raw.nama || ''),
        nspp: raw.nspp ? String(raw.nspp) : undefined,
        alamat: String(raw.alamat || ''),
        kecamatan: String(raw.kecamatan || ''),
        desa: String(raw.desa || ''),
        namaPimpinan: String(raw.namaPimpinan || ''),
        tahunBerdiri: Number(raw.tahunBerdiri) || 2000,
        tipe: (raw.tipe as PesantrenTipe) || 'Kombinasi',
        statusKeaktifan: (raw.statusKeaktifan as StatusKeaktifan) || 'aktif',
        lat: Number(raw.lat) || -8.066,
        lng: Number(raw.lng) || 111.901,
        ijopStatusSummary: (raw.ijopStatusSummary as IjopStatus) || 'belum_ada',
        totalSantriLatest: Number(raw.totalSantriLatest) || 0,
        totalPendidikLatest: Number(raw.totalPendidikLatest) || 0,
        updatedAt: raw.updatedAt,
      });
    }
    list.sort((a, b) => a.nama.localeCompare(b.nama));
    return list;
  } catch {
    return null;
  }
}
