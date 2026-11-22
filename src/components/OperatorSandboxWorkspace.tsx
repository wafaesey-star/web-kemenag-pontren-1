import { Building2, ClipboardCheck, FileCheck2, History, LayoutDashboard, LogOut, Menu, RotateCcw, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  IJOP_LABELS,
  STATUS_LABELS,
  calculateCompleteness,
  canTransitionVerification,
  computeIjopStatus,
  makeSafeDocId,
} from '../lib/domain';
import type { SavePesantrenPayload } from '../lib/firestoreService';
import { DUMMY_PESANTREN_SEED, buildSeedLegalitasStatus } from '../lib/seedData';
import type {
  DataPeriodik,
  Legalitas,
  LegalitasHistory,
  Pesantren,
  SystemConfig,
  UserProfile,
  VerifikasiLog,
} from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { PesantrenFormModal } from './PesantrenFormModal';

interface OperatorSandboxWorkspaceProps {
  config: SystemConfig | null;
  onOpenPublicDirectory: () => void;
  onExitSandbox: () => void;
}

type OperatorTab = 'ringkasan' | 'lembaga' | 'legalitas' | 'riwayat';

const SANDBOX_USER: UserProfile = {
  uid: 'sandbox_operator_uji',
  email: 'operator.uji@simulasi.local',
  displayName: 'Operator Uji Simulasi',
  role: 'operator',
  isActive: true,
};

const SANDBOX_IDS = ['ps_darul_hikmah_kota', 'ps_miftahul_uloom_boyolangu'] as const;
const PERIODE_OPTIONS = ['2024/2025', '2025/2026', '2026/2027'];

interface SandboxDataset {
  pesantrenList: Pesantren[];
  legalitasMap: Record<string, Legalitas>;
  legalitasHistoryMap: Record<string, LegalitasHistory[]>;
  periodikMap: Record<string, DataPeriodik>;
  verifikasiLogs: VerifikasiLog[];
}

function createInitialSandboxDataset(periode: string): SandboxDataset {
  const seedItems = DUMMY_PESANTREN_SEED.filter((item) =>
    (SANDBOX_IDS as readonly string[]).includes(item.id),
  );

  const pesantrenList: Pesantren[] = [];
  const legalitasMap: Record<string, Legalitas> = {};
  const legalitasHistoryMap: Record<string, LegalitasHistory[]> = {};
  const periodikMap: Record<string, DataPeriodik> = {};

  for (const item of seedItems) {
    const ijopStatus = computeIjopStatus(item.tanggalBerakhir);
    const totalSantriLatest = item.santriLaki + item.santriPerempuan;
    const totalPendidikLatest = item.ustadzCount + item.ustadzahCount;

    pesantrenList.push({
      id: item.id,
      nama: item.nama,
      nspp: item.nspp,
      alamat: item.alamat,
      kecamatan: item.kecamatan,
      desa: item.desa,
      telepon: item.telepon,
      email: item.email,
      namaPimpinan: item.namaPimpinan,
      tahunBerdiri: item.tahunBerdiri,
      tipe: item.tipe,
      statusKeaktifan: 'aktif',
      lat: item.lat,
      lng: item.lng,
      verificationStatus: item.verificationStatus,
      catatanRevisi: item.catatanRevisi || '',
      assignedOperatorUids: [SANDBOX_USER.uid],
      assignedOperatorEmails: [SANDBOX_USER.email],
      ijopStatusSummary: ijopStatus,
      ijopExpiredAt: item.tanggalBerakhir,
      totalSantriLatest,
      totalPendidikLatest,
      createdByUid: 'kemenag_seed',
    });

    const statusLegalitas = buildSeedLegalitasStatus(item.tanggalBerakhir);
    legalitasMap[item.id] = {
      pesantrenId: item.id,
      nomorIjop: item.nomorIjop,
      tanggalTerbit: item.tanggalTerbit,
      tanggalBerakhir: item.tanggalBerakhir,
      statusLegalitas,
      dokumenUrl: '',
      dokumenNama: `SK_IJOP_${item.id}.pdf`,
      catatan: 'Data contoh awal untuk pengujian alur perbaikan dan pengajuan operator.',
      updatedByUid: 'kemenag_seed',
    };

    legalitasHistoryMap[item.id] = [
      {
        id: `lh_${item.id}_initial`,
        pesantrenId: item.id,
        nomorIjop: item.nomorIjop,
        tanggalTerbit: item.tanggalTerbit,
        tanggalBerakhir: item.tanggalBerakhir,
        statusLegalitas,
        dokumenUrl: '',
        changedByUid: 'kemenag_seed',
        changedByEmail: 'kemenag.kabupaten@contoh.id',
      },
    ];

    const dpId = makeSafeDocId('dp', `${item.id}_${periode}`);
    periodikMap[dpId] = {
      id: dpId,
      pesantrenId: item.id,
      tahunAjaran: periode,
      santriLaki: item.santriLaki,
      santriPerempuan: item.santriPerempuan,
      santriMukim: item.santriMukim,
      santriNonMukim: item.santriNonMukim,
      santriLokal: item.santriLokal,
      santriLuarKabupaten: item.santriLuarKabupaten,
      ustadzCount: item.ustadzCount,
      ustadzahCount: item.ustadzahCount,
      pendidikS1KeAtas: item.pendidikS1KeAtas,
      pendidikTetap: item.pendidikTetap,
      pendidikTidakTetap: item.pendidikTidakTetap,
      luasTanahM2: item.luasTanahM2,
      luasBangunanM2: item.luasBangunanM2,
      jumlahAsrama: item.jumlahAsrama,
      jumlahRuangBelajar: item.jumlahRuangBelajar,
      jumlahMushola: item.jumlahMushola,
      jumlahToilet: item.jumlahToilet,
      statusTanah: item.statusTanah,
      kelayakanBangunan: item.kelayakanBangunan,
      updatedByUid: 'kemenag_seed',
    };
  }

  const miftahul = seedItems.find((s) => s.id === 'ps_miftahul_uloom_boyolangu');
  const darul = seedItems.find((s) => s.id === 'ps_darul_hikmah_kota');

  const verifikasiLogs: VerifikasiLog[] = [];
  if (miftahul) {
    verifikasiLogs.push({
      id: 'vlog_seed_miftahul',
      pesantrenId: miftahul.id,
      pesantrenNama: miftahul.nama,
      fromStatus: 'diajukan',
      toStatus: 'ditolak',
      catatanRevisi: miftahul.catatanRevisi || '',
      actorUid: 'kemenag_seed',
      actorEmail: 'admin.kemenag@contoh.id',
      actorRole: 'super_admin',
      createdAt: 'Contoh Riwayat Awal',
    });
  }
  if (darul) {
    verifikasiLogs.push({
      id: 'vlog_seed_darul',
      pesantrenId: darul.id,
      pesantrenNama: darul.nama,
      fromStatus: 'diverifikasi',
      toStatus: 'disetujui',
      actorUid: 'kemenag_seed',
      actorEmail: 'admin.kemenag@contoh.id',
      actorRole: 'super_admin',
      createdAt: 'Contoh Riwayat Awal',
    });
  }

  return {
    pesantrenList,
    legalitasMap,
    legalitasHistoryMap,
    periodikMap,
    verifikasiLogs,
  };
}

export function OperatorSandboxWorkspace({
  config,
  onOpenPublicDirectory,
  onExitSandbox,
}: OperatorSandboxWorkspaceProps) {
  const defaultPeriode = config?.activePeriode || '2025/2026';
  const kabupatenNama = config?.kabupatenNama || 'Kabupaten';

  const [selectedPeriode, setSelectedPeriode] = useState<string>(defaultPeriode);
  const [activeTab, setActiveTab] = useState<OperatorTab>('ringkasan');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [dataset, setDataset] = useState<SandboxDataset>(() =>
    createInitialSandboxDataset(defaultPeriode),
  );
  const [flashMsg, setFlashMsg] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingPesantren, setEditingPesantren] = useState<Pesantren | null>(null);
  const [submitTarget, setSubmitTarget] = useState<Pesantren | null>(null);

  const editingPeriodik = useMemo(() => {
    if (!editingPesantren) return null;
    const dpId = makeSafeDocId('dp', `${editingPesantren.id}_${selectedPeriode}`);
    return dataset.periodikMap[dpId] || null;
  }, [editingPesantren, dataset.periodikMap, selectedPeriode]);

  const dashboardMetrics = useMemo(() => {
    const list = dataset.pesantrenList;
    const totalSantri = list.reduce((sum, p) => {
      const dpId = makeSafeDocId('dp', `${p.id}_${selectedPeriode}`);
      const dp = dataset.periodikMap[dpId];
      return sum + (dp ? dp.santriLaki + dp.santriPerempuan : p.totalSantriLatest);
    }, 0);
    const totalPendidik = list.reduce((sum, p) => {
      const dpId = makeSafeDocId('dp', `${p.id}_${selectedPeriode}`);
      const dp = dataset.periodikMap[dpId];
      return sum + (dp ? dp.ustadzCount + dp.ustadzahCount : p.totalPendidikLatest);
    }, 0);
    const disetujuiCount = list.filter((p) => p.verificationStatus === 'disetujui').length;
    const ditolakCount = list.filter((p) => p.verificationStatus === 'ditolak').length;
    const draftCount = list.filter((p) => p.verificationStatus === 'draft').length;

    return {
      totalLembaga: list.length,
      totalSantri,
      totalPendidik,
      disetujuiCount,
      ditolakCount,
      draftCount,
    };
  }, [dataset, selectedPeriode]);

  const handleResetDemo = () => {
    setDataset(createInitialSandboxDataset(selectedPeriode));
    setErrorBanner('');
    setFlashMsg('Data simulasi operator berhasil dikembalikan ke kondisi contoh awal.');
  };

  const handleLocalSave = (payload: SavePesantrenPayload) => {
    const ijopStatusSummary = payload.nomorIjop.trim()
      ? computeIjopStatus(payload.tanggalBerakhir)
      : 'belum_ada';
    const totalSantriLatest = payload.santriLaki + payload.santriPerempuan;
    const totalPendidikLatest = payload.ustadzCount + payload.ustadzahCount;

    setDataset((prev) => {
      const nextPesantren = prev.pesantrenList.map((item) =>
        item.id === payload.pesantrenId
          ? {
              ...item,
              nama: payload.nama.trim(),
              nspp: payload.nspp.trim(),
              alamat: payload.alamat.trim(),
              kecamatan: payload.kecamatan.trim(),
              desa: payload.desa.trim(),
              telepon: payload.telepon.trim(),
              email: payload.email.trim(),
              namaPimpinan: payload.namaPimpinan.trim(),
              tahunBerdiri: Number(payload.tahunBerdiri) || 2000,
              tipe: payload.tipe,
              statusKeaktifan: payload.statusKeaktifan,
              lat: Number(payload.lat) || -8.066,
              lng: Number(payload.lng) || 111.901,
              ijopStatusSummary,
              ijopExpiredAt: payload.tanggalBerakhir.trim(),
              totalSantriLatest,
              totalPendidikLatest,
            }
          : item,
      );

      const nextLegalitasMap = { ...prev.legalitasMap };
      const nextHistoryMap = { ...prev.legalitasHistoryMap };

      if (payload.nomorIjop.trim() && payload.tanggalTerbit && payload.tanggalBerakhir) {
        const statusLegalitas =
          ijopStatusSummary === 'belum_ada' ? 'proses_perpanjangan' : ijopStatusSummary;
        nextLegalitasMap[payload.pesantrenId] = {
          pesantrenId: payload.pesantrenId,
          nomorIjop: payload.nomorIjop.trim(),
          tanggalTerbit: payload.tanggalTerbit,
          tanggalBerakhir: payload.tanggalBerakhir,
          statusLegalitas,
          dokumenUrl: payload.dokumenUrl.trim(),
          dokumenNama: payload.dokumenNama.trim(),
          catatan: payload.legalitasCatatan.trim(),
          updatedByUid: SANDBOX_USER.uid,
        };

        const existingHist = nextHistoryMap[payload.pesantrenId] || [];
        nextHistoryMap[payload.pesantrenId] = [
          {
            id: makeSafeDocId('lh', `${payload.pesantrenId}_${Date.now()}`),
            pesantrenId: payload.pesantrenId,
            nomorIjop: payload.nomorIjop.trim(),
            tanggalTerbit: payload.tanggalTerbit,
            tanggalBerakhir: payload.tanggalBerakhir,
            statusLegalitas,
            dokumenUrl: payload.dokumenUrl.trim(),
            changedByUid: SANDBOX_USER.uid,
            changedByEmail: SANDBOX_USER.email,
          },
          ...existingHist,
        ];
      }

      const dpId = makeSafeDocId('dp', `${payload.pesantrenId}_${payload.tahunAjaran}`);
      const nextPeriodikMap = {
        ...prev.periodikMap,
        [dpId]: {
          id: dpId,
          pesantrenId: payload.pesantrenId,
          tahunAjaran: payload.tahunAjaran,
          santriLaki: Number(payload.santriLaki) || 0,
          santriPerempuan: Number(payload.santriPerempuan) || 0,
          santriMukim: Number(payload.santriMukim) || 0,
          santriNonMukim: Number(payload.santriNonMukim) || 0,
          santriLokal: Number(payload.santriLokal) || 0,
          santriLuarKabupaten: Number(payload.santriLuarKabupaten) || 0,
          ustadzCount: Number(payload.ustadzCount) || 0,
          ustadzahCount: Number(payload.ustadzahCount) || 0,
          pendidikS1KeAtas: Number(payload.pendidikS1KeAtas) || 0,
          pendidikTetap: Number(payload.pendidikTetap) || 0,
          pendidikTidakTetap: Number(payload.pendidikTidakTetap) || 0,
          luasTanahM2: Number(payload.luasTanahM2) || 0,
          luasBangunanM2: Number(payload.luasBangunanM2) || 0,
          jumlahAsrama: Number(payload.jumlahAsrama) || 0,
          jumlahRuangBelajar: Number(payload.jumlahRuangBelajar) || 0,
          jumlahMushola: Number(payload.jumlahMushola) || 0,
          jumlahToilet: Number(payload.jumlahToilet) || 0,
          statusTanah: payload.statusTanah,
          kelayakanBangunan: payload.kelayakanBangunan,
          updatedByUid: SANDBOX_USER.uid,
        },
      };

      return {
        ...prev,
        pesantrenList: nextPesantren,
        legalitasMap: nextLegalitasMap,
        legalitasHistoryMap: nextHistoryMap,
        periodikMap: nextPeriodikMap,
      };
    });
  };

  const handleConfirmSubmit = () => {
    if (!submitTarget) return;
    const check = canTransitionVerification(
      submitTarget.verificationStatus,
      'diajukan',
      'operator',
    );
    if (!check.allowed) {
      setErrorBanner(check.reason || 'Pengajuan verifikasi tidak diizinkan.');
      setSubmitTarget(null);
      return;
    }

    const nowLabel = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    setDataset((prev) => ({
      ...prev,
      pesantrenList: prev.pesantrenList.map((item) =>
        item.id === submitTarget.id
          ? {
              ...item,
              verificationStatus: 'diajukan',
              catatanRevisi: '',
            }
          : item,
      ),
      verifikasiLogs: [
        {
          id: makeSafeDocId('vlog', `${submitTarget.id}_${Date.now()}`),
          pesantrenId: submitTarget.id,
          pesantrenNama: submitTarget.nama,
          fromStatus: submitTarget.verificationStatus,
          toStatus: 'diajukan',
          actorUid: SANDBOX_USER.uid,
          actorEmail: SANDBOX_USER.email,
          actorRole: 'operator',
          createdAt: nowLabel,
        },
        ...prev.verifikasiLogs,
      ],
    }));

    setFlashMsg(
      `Pengajuan verifikasi untuk ${submitTarget.nama} berhasil disimulasikan (status kini: Diajukan).`,
    );
    setSubmitTarget(null);
  };

  const navItems: { id: OperatorTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'lembaga', label: 'Lembaga Saya', icon: Building2 },
    { id: 'legalitas', label: 'Legalitas & IJOP', icon: FileCheck2 },
    { id: 'riwayat', label: 'Riwayat Pengajuan', icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#111815] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-slate-900/10 bg-white shrink-0">
        <div className="h-16 px-5 border-b border-slate-900/10 flex items-center justify-between">
          <div>
            <p className="font-display text-sm font-semibold text-[#0F5132] tracking-tight">
              SimPoren Kemenag
            </p>
            <p className="text-[11px] text-[#6A7770] truncate max-w-[190px]">{kabupatenNama}</p>
          </div>
        </div>

        <nav aria-label="Menu Simulasi Operator" className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-[#0F5132]/10 text-[#0F5132]'
                    : 'text-[#4B5751] hover:bg-[#F1F5F3] hover:text-[#111815]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-900/10 text-xs space-y-2">
          <button
            type="button"
            onClick={handleResetDemo}
            className="w-full flex items-center gap-2 px-3 py-2 text-left font-medium text-[#B45309] bg-amber-50 border border-amber-200 hover:bg-amber-100/70 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Data Contoh</span>
          </button>
          <button
            type="button"
            onClick={onOpenPublicDirectory}
            className="w-full px-3 py-2 text-left font-medium text-[#0F5132] bg-[#F1F5F3] hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Lihat Direktori Publik
          </button>
          <p className="text-[#6A7770] truncate">{SANDBOX_USER.email}</p>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-50 w-64 bg-white h-full border-r border-slate-900/10 flex flex-col">
            <div className="h-16 px-4 border-b border-slate-900/10 flex items-center justify-between">
              <span className="font-display text-sm font-semibold text-[#0F5132]">
                SimPoren Kemenag
              </span>
              <button
                type="button"
                aria-label="Tutup navigasi"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-[#4B5751] hover:bg-[#F1F5F3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left ${
                      isActive
                        ? 'bg-[#0F5132]/10 text-[#0F5132]'
                        : 'text-[#4B5751] hover:bg-[#F1F5F3]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-900/10 space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleResetDemo();
                  setMobileNavOpen(false);
                }}
                className="w-full px-3 py-2 text-xs font-medium text-[#B45309] bg-amber-50 border border-amber-200 rounded-lg text-left"
              >
                Reset Data Contoh
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false);
                  onOpenPublicDirectory();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-[#0F5132] bg-[#F1F5F3] rounded-lg text-left"
              >
                Lihat Direktori Publik
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-900/10 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#4B5751] hover:bg-[#F1F5F3]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-xs text-[#6A7770] truncate">
                {kabupatenNama} / Dashboard Operator
              </p>
              <h1 className="text-base font-semibold text-[#111815] truncate">
                {navItems.find((n) => n.id === activeTab)?.label || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="sandbox-periode-select" className="sr-only">
              Pilih Periode Tahun Ajaran
            </label>
            <select
              id="sandbox-periode-select"
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-mono-num bg-[#F8FAF9] border border-slate-900/15 rounded-lg"
            >
              {PERIODE_OPTIONS.map((pr) => (
                <option key={pr} value={pr}>
                  TA {pr}
                </option>
              ))}
            </select>

            <span className="hidden sm:inline text-xs text-[#B45309] font-medium whitespace-nowrap shrink-0">
              Operator Uji (Lokal)
            </span>

            <button
              type="button"
              onClick={onExitSandbox}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4B5751] hover:text-[#111815] bg-[#F1F5F3] hover:bg-slate-200/70 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Simulasi</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-[1280px] w-full mx-auto space-y-6">
          {/* Sandbox Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#B45309]">
                Mode Simulasi Operator Uji (Data Contoh Lokal)
              </p>
              <p className="text-xs text-[#4B5751] leading-relaxed">
                Anda sedang mencoba dashboard operasional pesantren menggunakan data contoh terisolasi di browser.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111815] bg-white border border-amber-300 hover:bg-amber-100/60 rounded-lg whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Data Contoh</span>
              </button>
            </div>
          </div>

          {flashMsg && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-[#0F5132] text-sm"
            >
              <span>{flashMsg}</span>
              <button
                type="button"
                aria-label="Tutup pesan"
                onClick={() => setFlashMsg('')}
                className="text-xs font-medium underline"
              >
                Tutup
              </button>
            </div>
          )}

          {errorBanner && (
            <div
              role="alert"
              className="flex items-center justify-between gap-4 p-3 rounded-lg bg-red-50 border border-red-200 text-[#B91C1C] text-sm"
            >
              <span>{errorBanner}</span>
              <button
                type="button"
                aria-label="Tutup peringatan"
                onClick={() => setErrorBanner('')}
                className="text-xs font-medium underline"
              >
                Tutup
              </button>
            </div>
          )}

          {/* ================= TAB 1: RINGKASAN ================= */}
          {activeTab === 'ringkasan' && (
            <div className="space-y-6">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-900/10 rounded-xl p-5">
                  <p className="text-xs text-[#6A7770]">Lembaga Ditugaskan</p>
                  <p className="mt-2 text-2xl font-semibold font-mono-num">
                    {dashboardMetrics.totalLembaga}
                  </p>
                  <p className="mt-1 text-[11px] text-[#0F5132]">Aktif dalam pembinaan</p>
                </div>
                <div className="bg-white border border-slate-900/10 rounded-xl p-5">
                  <p className="text-xs text-[#6A7770]">Total Santri ({selectedPeriode})</p>
                  <p className="mt-2 text-2xl font-semibold font-mono-num">
                    {dashboardMetrics.totalSantri.toLocaleString('id-ID')}
                  </p>
                  <p className="mt-1 text-[11px] text-[#6A7770]">Mukim & Non-mukim</p>
                </div>
                <div className="bg-white border border-slate-900/10 rounded-xl p-5">
                  <p className="text-xs text-[#6A7770]">Tenaga Pendidik</p>
                  <p className="mt-2 text-2xl font-semibold font-mono-num">
                    {dashboardMetrics.totalPendidik.toLocaleString('id-ID')}
                  </p>
                  <p className="mt-1 text-[11px] text-[#6A7770]">Ustadz & Ustadzah</p>
                </div>
                <div className="bg-white border border-slate-900/10 rounded-xl p-5">
                  <p className="text-xs text-[#6A7770]">Status Verifikasi</p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-medium">
                    <span className="text-[#0F5132]">{dashboardMetrics.disetujuiCount} Disetujui</span>
                    <span>·</span>
                    <span className="text-[#B91C1C]">{dashboardMetrics.ditolakCount} Revisi</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#6A7770]">{dashboardMetrics.draftCount} Draft</p>
                </div>
              </div>

              {/* Revision Alerts */}
              {dataset.pesantrenList.some((p) => p.verificationStatus === 'ditolak') && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
                  <h2 className="text-sm font-semibold text-[#B91C1C]">Perhatian: Catatan Revisi dari Kemenag</h2>
                  {dataset.pesantrenList
                    .filter((p) => p.verificationStatus === 'ditolak')
                    .map((p) => (
                      <div key={p.id} className="bg-white p-3.5 rounded-lg border border-red-100 text-xs space-y-1">
                        <p className="font-semibold text-[#111815]">{p.nama}</p>
                        <p className="text-[#B91C1C]">{p.catatanRevisi || 'Mohon perbarui data sesuai ketentuan.'}</p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPesantren(p);
                              setFormOpen(true);
                            }}
                            className="px-3 py-1.5 font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-md transition-colors"
                          >
                            Perbarui Data &amp; Lengkapi
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Quick Jump List */}
              <div className="bg-white border border-slate-900/10 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Lembaga Pesantren Binaan</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('lembaga')}
                    className="text-xs font-medium text-[#0F5132] hover:underline"
                  >
                    Kelola Semua →
                  </button>
                </div>
                <div className="divide-y divide-slate-900/10 text-sm">
                  {dataset.pesantrenList.map((p) => {
                    const leg = dataset.legalitasMap[p.id] || null;
                    const dpId = makeSafeDocId('dp', `${p.id}_${selectedPeriode}`);
                    const dp = dataset.periodikMap[dpId] || null;
                    const comp = calculateCompleteness(p, leg, dp);

                    return (
                      <div key={p.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#111815]">{p.nama}</p>
                          <p className="text-xs text-[#4B5751] mt-0.5">
                            {p.kecamatan} · Kelengkapan Data: <strong className="font-mono-num">{comp.percent}%</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                              p.verificationStatus === 'disetujui'
                                ? 'bg-emerald-50 border-emerald-200 text-[#0F5132]'
                                : p.verificationStatus === 'ditolak'
                                  ? 'bg-red-50 border-red-200 text-[#B91C1C]'
                                  : 'bg-[#F1F5F3] border-slate-900/10 text-[#111815]'
                            }`}
                          >
                            {STATUS_LABELS[p.verificationStatus]}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPesantren(p);
                              setFormOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-[#111815] bg-[#F1F5F3] hover:bg-slate-200/70 rounded-lg"
                          >
                            Ubah
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: LEMBAGA SAYA ================= */}
          {activeTab === 'lembaga' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Pengelolaan Lembaga Pesantren</h2>
                <p className="text-xs text-[#4B5751] mt-0.5">
                  Lengkapi profil pokok, data santri, tenaga pendidik, dan sarana prasarana untuk tahun ajaran {selectedPeriode}.
                </p>
              </div>

              {dataset.pesantrenList.map((p) => {
                const leg = dataset.legalitasMap[p.id] || null;
                const dpId = makeSafeDocId('dp', `${p.id}_${selectedPeriode}`);
                const dp = dataset.periodikMap[dpId] || null;
                const comp = calculateCompleteness(p, leg, dp);
                const canSubmit =
                  p.verificationStatus === 'draft' || p.verificationStatus === 'ditolak';

                return (
                  <article
                    key={p.id}
                    className="bg-white border border-slate-900/10 rounded-xl p-6 space-y-5"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#6A7770] font-mono-num">
                          NSPP {p.nspp || '-'} · {p.tipe} · {p.kecamatan}, {p.desa}
                        </p>
                        <h2 className="text-xl font-semibold text-[#111815] mt-1">{p.nama}</h2>
                        <p className="text-sm text-[#4B5751] mt-1">
                          Pimpinan: {p.namaPimpinan} · Kelengkapan Data:{' '}
                          <strong className="font-mono-num">{comp.percent}%</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                            p.verificationStatus === 'disetujui'
                              ? 'bg-emerald-50 border-emerald-200 text-[#0F5132]'
                              : p.verificationStatus === 'ditolak'
                                ? 'bg-red-50 border-red-200 text-[#B91C1C]'
                                : 'bg-[#F1F5F3] border-slate-900/10 text-[#111815]'
                          }`}
                        >
                          {STATUS_LABELS[p.verificationStatus]}
                        </span>
                      </div>
                    </div>

                    {p.verificationStatus === 'ditolak' && p.catatanRevisi && (
                      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-[#B91C1C]">
                        <p className="font-semibold">Catatan Revisi dari Kemenag:</p>
                        <p className="mt-1">{p.catatanRevisi}</p>
                      </div>
                    )}

                    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-slate-900/10 py-4 text-sm">
                      <div>
                        <dt className="text-xs text-[#6A7770]">Total Santri ({selectedPeriode})</dt>
                        <dd className="mt-1 text-lg font-semibold font-mono-num">
                          {(dp ? dp.santriLaki + dp.santriPerempuan : p.totalSantriLatest).toLocaleString('id-ID')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#6A7770]">Tenaga Pendidik</dt>
                        <dd className="mt-1 text-lg font-semibold font-mono-num">
                          {(dp ? dp.ustadzCount + dp.ustadzahCount : p.totalPendidikLatest).toLocaleString('id-ID')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#6A7770]">Status IJOP</dt>
                        <dd className="mt-1 font-medium text-[#111815]">
                          {IJOP_LABELS[p.ijopStatusSummary]}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-[#6A7770]">Ruang Belajar / Tanah</dt>
                        <dd className="mt-1 font-mono-num">
                          {dp ? `${dp.jumlahRuangBelajar} ruang · ${dp.luasTanahM2} m²` : 'Belum diisi'}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-[#6A7770]">
                        {comp.missingSections.length === 0
                          ? 'Semua bagian utama sudah terisi.'
                          : `Perlu dilengkapi: ${comp.missingSections.join(', ')}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPesantren(p);
                            setFormOpen(true);
                          }}
                          className="px-4 py-2 text-sm font-medium text-[#111815] bg-[#F1F5F3] hover:bg-slate-200/70 rounded-lg transition-colors"
                        >
                          {canSubmit ? 'Lengkapi / Ubah Data' : 'Lihat Detail Data'}
                        </button>
                        {canSubmit && (
                          <button
                            type="button"
                            onClick={() => setSubmitTarget(p)}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors"
                          >
                            Ajukan Verifikasi
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}

          {/* ================= TAB 3: LEGALITAS & IJOP ================= */}
          {activeTab === 'legalitas' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Legalitas &amp; Izin Operasional (IJOP)</h2>
                <p className="text-xs text-[#4B5751] mt-0.5">
                  Informasi nomor SK IJOP, tanggal terbit, masa berlaku, dan riwayat perpanjangan dokumen lembaga.
                </p>
              </div>

              {dataset.pesantrenList.map((p) => {
                const leg = dataset.legalitasMap[p.id] || null;
                const historyList = dataset.legalitasHistoryMap[p.id] || [];

                return (
                  <article key={p.id} className="bg-white border border-slate-900/10 rounded-xl p-6 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#6A7770] font-mono-num">NSPP {p.nspp || '-'}</p>
                        <h3 className="text-base font-semibold text-[#111815] mt-0.5">{p.nama}</h3>
                      </div>
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                          p.ijopStatusSummary === 'aktif'
                            ? 'bg-emerald-50 border-emerald-200 text-[#0F5132]'
                            : 'bg-amber-50 border-amber-200 text-[#B45309]'
                        }`}
                      >
                        {IJOP_LABELS[p.ijopStatusSummary]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#F8FAF9] p-4 rounded-lg text-xs">
                      <div>
                        <span className="text-[#6A7770] block">Nomor SK IJOP</span>
                        <strong className="text-[#111815] font-mono-num mt-0.5 block">{leg?.nomorIjop || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-[#6A7770] block">Tanggal Terbit</span>
                        <strong className="text-[#111815] font-mono-num mt-0.5 block">{leg?.tanggalTerbit || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-[#6A7770] block">Tanggal Berakhir</span>
                        <strong className="text-[#111815] font-mono-num mt-0.5 block">{leg?.tanggalBerakhir || '-'}</strong>
                      </div>
                    </div>

                    {historyList.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-[#4B5751] mb-2">Riwayat Dokumen Legalitas</p>
                        <div className="divide-y divide-slate-900/10 text-xs">
                          {historyList.map((h) => (
                            <div key={h.id} className="py-2 flex items-center justify-between">
                              <span className="font-mono-num">{h.nomorIjop} (Berakhir: {h.tanggalBerakhir})</span>
                              <span className="text-[#6A7770]">{h.changedByEmail || h.statusLegalitas}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          {/* ================= TAB 4: RIWAYAT PENGAJUAN ================= */}
          {activeTab === 'riwayat' && (
            <section className="bg-white border border-slate-900/10 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Riwayat Status Verifikasi</h2>
                <p className="text-xs text-[#4B5751] mt-0.5">
                  Jejak log pengajuan verifikasi, tanggapan Kemenag, dan catatan revisi.
                </p>
              </div>

              {dataset.verifikasiLogs.length === 0 ? (
                <p className="text-sm text-[#4B5751] py-6 text-center">Belum ada riwayat pengajuan verifikasi.</p>
              ) : (
                <div className="divide-y divide-slate-900/10 text-sm">
                  {dataset.verifikasiLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium text-[#111815]">{log.pesantrenNama}</p>
                        <p className="text-xs text-[#4B5751] mt-0.5">
                          {STATUS_LABELS[log.fromStatus]} →{' '}
                          <strong className="text-[#0F5132]">
                            {STATUS_LABELS[log.toStatus]}
                          </strong>
                          {log.catatanRevisi ? ` · Catatan: "${log.catatanRevisi}"` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-[#6A7770] font-mono-num shrink-0">
                        {typeof log.createdAt === 'string' ? log.createdAt : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <PesantrenFormModal
        open={formOpen}
        user={SANDBOX_USER}
        pesantren={editingPesantren}
        legalitas={editingPesantren ? dataset.legalitasMap[editingPesantren.id] || null : null}
        legalitasHistory={
          editingPesantren ? dataset.legalitasHistoryMap[editingPesantren.id] || [] : []
        }
        periodik={editingPeriodik}
        activePeriode={selectedPeriode}
        onClose={() => {
          setFormOpen(false);
          setEditingPesantren(null);
        }}
        onLocalSave={handleLocalSave}
        onSaved={(message) => {
          setFormOpen(false);
          setEditingPesantren(null);
          setFlashMsg(`${message} (Simulasi lokal)`);
        }}
      />

      <ConfirmDialog
        open={Boolean(submitTarget)}
        title="Ajukan Verifikasi ke Kemenag (Simulasi)"
        description={
          submitTarget
            ? `Status data ${submitTarget.nama} akan berubah menjadi Diajukan dan formulir akan terkunci sebagaimana alur operator asli.`
            : ''
        }
        confirmLabel="Ya, Ajukan Verifikasi"
        onCancel={() => setSubmitTarget(null)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
