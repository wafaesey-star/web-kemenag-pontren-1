export type UserRole = 'super_admin' | 'operator';
export type PesantrenTipe = 'Salafiyah' | 'Khalafiyah/Modern' | 'Kombinasi';
export type StatusKeaktifan = 'aktif' | 'nonaktif';
export type VerificationStatus = 'draft' | 'diajukan' | 'diverifikasi' | 'disetujui' | 'ditolak';
export type IjopStatus = 'aktif' | 'segera_berakhir' | 'kedaluwarsa' | 'belum_ada';
export type LegalitasStatus = 'aktif' | 'segera_berakhir' | 'kedaluwarsa' | 'proses_perpanjangan';
export type TanahStatus = 'Wakaf' | 'Milik Yayasan' | 'Sewa/Pinjam' | 'Lainnya';
export type BangunanKelayakan = 'Layak' | 'Perlu Perbaikan Ringan' | 'Perlu Renovasi Berat';

export const BOOTSTRAP_ADMIN_EMAIL = 'wafaesey@gmail.com';

// Synchronized verbatim with firebase-blueprint.json constraints
export const BLUEPRINT_LIMITS = {
  ID_PATTERN: /^[a-zA-Z0-9_-]{1,128}$/,
  HTTPS_URL_PATTERN: /^https:\/\/.+/,
  MAX_NAME: 160,
  MAX_ALAMAT: 300,
  MAX_KECAMATAN: 80,
  MAX_DESA: 80,
  MAX_NSPP: 32,
  MAX_TELEPON: 32,
  MAX_EMAIL: 160,
  MAX_PIMPINAN: 120,
  MAX_CATATAN: 1000,
  MAX_URL: 500,
  MAX_OPERATORS_PER_PESANTREN: 10,
} as const;

export const KECAMATAN_OPTIONS = [
  'Kec. Kota',
  'Kec. Sukorejo',
  'Kec. Karangrejo',
  'Kec. Sumbergempol',
  'Kec. Ngunut',
  'Kec. Boyolangu',
  'Kec. Kalidawir',
  'Kec. Gondang',
] as const;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  inviteId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OperatorInvite {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  isActive: boolean;
  assignedPesantrenIds: string[];
  linkedUid?: string;
  createdByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OperatorAssignment {
  id: string;
  pesantrenId: string;
  pesantrenNama: string;
  operatorEmail: string;
  operatorUid?: string;
  operatorName: string;
  status: StatusKeaktifan;
  assignedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Pesantren {
  id: string;
  nama: string;
  nspp?: string;
  alamat: string;
  kecamatan: string;
  desa: string;
  telepon?: string;
  email?: string;
  namaPimpinan: string;
  tahunBerdiri: number;
  tipe: PesantrenTipe;
  statusKeaktifan: StatusKeaktifan;
  lat: number;
  lng: number;
  verificationStatus: VerificationStatus;
  catatanRevisi?: string;
  assignedOperatorUids: string[];
  assignedOperatorEmails: string[];
  ijopStatusSummary: IjopStatus;
  ijopExpiredAt?: string;
  totalSantriLatest: number;
  totalPendidikLatest: number;
  createdByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PublicPesantren {
  id: string;
  nama: string;
  nspp?: string;
  alamat: string;
  kecamatan: string;
  desa: string;
  namaPimpinan: string;
  tahunBerdiri: number;
  tipe: PesantrenTipe;
  statusKeaktifan: StatusKeaktifan;
  lat: number;
  lng: number;
  ijopStatusSummary: IjopStatus;
  totalSantriLatest: number;
  totalPendidikLatest: number;
  updatedAt?: unknown;
}

export interface Legalitas {
  pesantrenId: string;
  nomorIjop: string;
  tanggalTerbit: string;
  tanggalBerakhir: string;
  statusLegalitas: LegalitasStatus;
  dokumenUrl?: string;
  dokumenNama?: string;
  catatan?: string;
  updatedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LegalitasHistory {
  id: string;
  pesantrenId: string;
  nomorIjop: string;
  tanggalTerbit: string;
  tanggalBerakhir: string;
  statusLegalitas: LegalitasStatus;
  dokumenUrl?: string;
  changedByUid: string;
  changedByEmail?: string;
  createdAt?: unknown;
}

export interface DataPeriodik {
  id: string;
  pesantrenId: string;
  tahunAjaran: string;
  santriLaki: number;
  santriPerempuan: number;
  santriMukim: number;
  santriNonMukim: number;
  santriLokal: number;
  santriLuarKabupaten: number;
  ustadzCount: number;
  ustadzahCount: number;
  pendidikS1KeAtas: number;
  pendidikTetap: number;
  pendidikTidakTetap: number;
  luasTanahM2: number;
  luasBangunanM2: number;
  jumlahAsrama: number;
  jumlahRuangBelajar: number;
  jumlahMushola: number;
  jumlahToilet: number;
  statusTanah: TanahStatus;
  kelayakanBangunan: BangunanKelayakan;
  updatedByUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VerifikasiLog {
  id: string;
  pesantrenId: string;
  pesantrenNama: string;
  fromStatus: VerificationStatus;
  toStatus: VerificationStatus;
  catatanRevisi?: string;
  actorUid: string;
  actorEmail?: string;
  actorRole: UserRole;
  createdAt?: unknown;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt?: unknown;
}

export interface SystemConfig {
  kabupatenNama: string;
  activePeriode: string;
  allowMultiOperatorPerPesantren: boolean;
  allowMultiPesantrenPerOperator: boolean;
  allowPostApprovalEdit: boolean;
  publicDirectoryEnabled: boolean;
  updatedByUid: string;
  updatedAt?: unknown;
}
