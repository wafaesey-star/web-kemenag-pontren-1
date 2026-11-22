import {
  BLUEPRINT_LIMITS,
  type DataPeriodik,
  type IjopStatus,
  type Legalitas,
  type Pesantren,
  type UserProfile,
  type VerificationStatus,
} from '../types';

export function makeSafeDocId(prefix: string, raw: string): string {
  const clean = `${prefix}_${raw}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
  return clean || `${prefix}_${Date.now()}`;
}

export function isSafeHttpsUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.length > BLUEPRINT_LIMITS.MAX_URL) return false;
  return BLUEPRINT_LIMITS.HTTPS_URL_PATTERN.test(trimmed);
}

export function computeIjopStatus(tanggalBerakhir: string, today = new Date()): IjopStatus {
  if (!tanggalBerakhir) return 'belum_ada';
  const end = new Date(`${tanggalBerakhir}T00:00:00`);
  if (Number.isNaN(end.getTime())) return 'belum_ada';
  const nowDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.ceil((end.getTime() - nowDay.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'kedaluwarsa';
  if (diffDays <= 90) return 'segera_berakhir';
  return 'aktif';
}

export function canAccessPesantren(
  user: Pick<UserProfile, 'uid' | 'email' | 'role' | 'isActive'> | null,
  pesantren: Pick<Pesantren, 'assignedOperatorUids' | 'assignedOperatorEmails'>,
): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'super_admin') return true;
  const email = user.email.trim().toLowerCase();
  return (
    pesantren.assignedOperatorUids.includes(user.uid) ||
    pesantren.assignedOperatorEmails.map((e) => e.toLowerCase()).includes(email)
  );
}

export function canTransitionVerification(
  from: VerificationStatus,
  to: VerificationStatus,
  role: UserProfile['role'],
  allowPostApprovalEdit = true,
  catatanRevisi = '',
): { allowed: boolean; reason?: string } {
  if (role === 'operator') {
    if ((from === 'draft' || from === 'ditolak') && to === 'diajukan') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Operator hanya dapat mengajukan data yang berstatus Draft atau Ditolak.',
    };
  }

  // Super Admin Kemenag transitions
  if (from === 'diajukan' && to === 'diverifikasi') return { allowed: true };
  if ((from === 'diajukan' || from === 'diverifikasi') && to === 'disetujui') {
    return { allowed: true };
  }
  if ((from === 'diajukan' || from === 'diverifikasi') && to === 'ditolak') {
    if (!catatanRevisi.trim()) {
      return {
        allowed: false,
        reason: 'Catatan revisi wajib diisi saat menolak pengajuan.',
      };
    }
    return { allowed: true };
  }
  if (from === 'disetujui' && to === 'draft') {
    return allowPostApprovalEdit
      ? { allowed: true }
      : { allowed: false, reason: 'Edit pasca-persetujuan sedang dinonaktifkan di Pengaturan.' };
  }
  if (from === 'ditolak' && to === 'draft') return { allowed: true };

  return {
    allowed: false,
    reason: `Transisi status dari "${from}" ke "${to}" tidak diizinkan.`,
  };
}

export function calculateCompleteness(
  pesantren: Partial<Pesantren> | null,
  legalitas: Partial<Legalitas> | null,
  periodik: Partial<DataPeriodik> | null,
): { percent: number; missingSections: string[] } {
  const checks: { label: string; ok: boolean }[] = [
    {
      label: 'Profil Pokok',
      ok: Boolean(
        pesantren?.nama?.trim() &&
          pesantren?.alamat?.trim() &&
          pesantren?.kecamatan?.trim() &&
          pesantren?.desa?.trim() &&
          pesantren?.namaPimpinan?.trim(),
      ),
    },
    {
      label: 'Legalitas / IJOP',
      ok: Boolean(legalitas?.nomorIjop?.trim() && legalitas?.tanggalBerakhir?.trim()),
    },
    {
      label: 'Data Santri',
      ok: Boolean(periodik && (periodik.santriLaki ?? 0) + (periodik.santriPerempuan ?? 0) > 0),
    },
    {
      label: 'Tenaga Pendidik',
      ok: Boolean(periodik && (periodik.ustadzCount ?? 0) + (periodik.ustadzahCount ?? 0) > 0),
    },
    {
      label: 'Sarana & Prasarana',
      ok: Boolean(periodik && (periodik.luasTanahM2 ?? 0) > 0 && (periodik.jumlahRuangBelajar ?? 0) > 0),
    },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((done / checks.length) * 100),
    missingSections: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

// Neutralize CSV/Excel formula injection (=, +, -, @, tab, CR)
export function sanitizeSpreadsheetCell(value: string | number | undefined | null): string | number {
  if (typeof value === 'number') return value;
  const str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export const STATUS_LABELS: Record<VerificationStatus, string> = {
  draft: 'Draft',
  diajukan: 'Diajukan',
  diverifikasi: 'Diverifikasi',
  disetujui: 'Disetujui',
  ditolak: 'Perlu Revisi',
};

export const IJOP_LABELS: Record<IjopStatus, string> = {
  aktif: 'Aktif',
  segera_berakhir: 'Segera Berakhir (≤90 hari)',
  kedaluwarsa: 'Kedaluwarsa',
  belum_ada: 'Belum Ada IJOP',
};
