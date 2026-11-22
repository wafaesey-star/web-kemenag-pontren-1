import { MapPin, Search, X, Building2, Users, BookOpen, ShieldCheck, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IJOP_LABELS, STATUS_LABELS } from '../lib/domain';
import { KECAMATAN_OPTIONS, type PublicPesantren, type SystemConfig } from '../types';
import { PesantrenMap } from './PesantrenMap';
import { PWAInstallButton } from './PWAInstallButton';

interface PublicDirectoryProps {
  items: PublicPesantren[];
  loading: boolean;
  config: SystemConfig | null;
  onLoginClick: () => void;
  signingIn: boolean;
}

type PublicTab = 'direktori' | 'peta' | 'rekap' | 'ketentuan';

export function PublicDirectory({
  items,
  loading,
  config,
  onLoginClick,
  signingIn,
}: PublicDirectoryProps) {
  const [activeTab, setActiveTab] = useState<PublicTab>('direktori');
  const [searchTerm, setSearchTerm] = useState('');
  const [kecamatan, setKecamatan] = useState('ALL');
  const [tipe, setTipe] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailDialogRef = useRef<HTMLDialogElement>(null);

  const directoryEnabled = config?.publicDirectoryEnabled ?? true;
  const kabupatenNama = config?.kabupatenNama || 'Kabupaten';

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      if (kecamatan !== 'ALL' && item.kecamatan !== kecamatan) return false;
      if (tipe !== 'ALL' && item.tipe !== tipe) return false;
      if (!q) return true;
      return (
        item.nama.toLowerCase().includes(q) ||
        item.desa.toLowerCase().includes(q) ||
        (item.nspp || '').toLowerCase().includes(q) ||
        item.namaPimpinan.toLowerCase().includes(q)
      );
    });
  }, [items, searchTerm, kecamatan, tipe]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId],
  );

  useEffect(() => {
    const dlg = detailDialogRef.current;
    if (!dlg) return;
    if (selectedItem && !dlg.open) {
      dlg.showModal();
    } else if (!selectedItem && dlg.open) {
      dlg.close();
    }
  }, [selectedItem]);

  const stats = useMemo(() => {
    const totalSantri = items.reduce((acc, p) => acc + p.totalSantriLatest, 0);
    const totalPendidik = items.reduce((acc, p) => acc + p.totalPendidikLatest, 0);
    const coveredKec = new Set(items.map((p) => p.kecamatan)).size;
    return { totalLembaga: items.length, totalSantri, totalPendidik, coveredKec };
  }, [items]);

  const kecamatanSummary = useMemo(() => {
    const counts = new Map<string, { lembaga: number; santri: number }>();
    for (const item of items) {
      const prev = counts.get(item.kecamatan) || { lembaga: 0, santri: 0 };
      counts.set(item.kecamatan, {
        lembaga: prev.lembaga + 1,
        santri: prev.santri + item.totalSantriLatest,
      });
    }
    return Array.from(counts.entries()).sort((a, b) => b[1].lembaga - a[1].lembaga);
  }, [items]);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#111815]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-900/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-[1440px] px-8 h-18 flex items-center justify-between gap-8">
          <a
            href="/"
            className="font-display text-lg font-semibold tracking-tight text-[#0F5132] whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#0F5132]" />
            SimPoren Kemenag
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5751]">
            <button
              type="button"
              onClick={() => setActiveTab('direktori')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'direktori'
                  ? 'border-[#0F5132] text-[#0F5132] font-semibold'
                  : 'border-transparent hover:text-[#111815]'
              }`}
            >
              Direktori Lembaga
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('peta')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'peta'
                  ? 'border-[#0F5132] text-[#0F5132] font-semibold'
                  : 'border-transparent hover:text-[#111815]'
              }`}
            >
              Peta Sebaran
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rekap')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'rekap'
                  ? 'border-[#0F5132] text-[#0F5132] font-semibold'
                  : 'border-transparent hover:text-[#111815]'
              }`}
            >
              Rekapitulasi Wilayah
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ketentuan')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'ketentuan'
                  ? 'border-[#0F5132] text-[#0F5132] font-semibold'
                  : 'border-transparent hover:text-[#111815]'
              }`}
            >
              Ketentuan &amp; Legalitas
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              disabled={signingIn}
              onClick={onLoginClick}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 shadow-xs"
            >
              {signingIn ? 'Membuka Masuk...' : 'Masuk Portal'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-8 py-12 space-y-12">
        {/* Editorial Hero Section */}
        <section className="max-w-4xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-medium text-[#0F5132] tracking-wide">
            <span>Kementerian Agama Republik Indonesia</span>
            <span aria-hidden="true">·</span>
            <span>{kabupatenNama}</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#111815] leading-[1.12] text-wrap balance">
            Direktori &amp; Pendataan Resmi Pondok Pesantren Terverifikasi
          </h1>
          <p className="text-lg text-[#4B5751] leading-relaxed max-w-2xl font-normal">
            Pusat informasi dan pendataan terpadu lembaga pendidikan Islam tingkat kabupaten. Memastikan validitas profil kelembagaan, status izin operasional (IJOP), dan statistik santri secara transparan.
          </p>
        </section>

        {/* Minimalist Stats Strip */}
        <section aria-label="Ringkasan statistik" className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-slate-900/10 rounded-2xl p-6 shadow-xs hover:border-[#0F5132]/30 transition-colors">
            <div className="flex items-center justify-between text-[#6A7770]">
              <span className="text-xs font-medium uppercase tracking-wider">Lembaga Aktif</span>
              <Building2 className="w-4 h-4 text-[#0F5132]" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono-num text-[#111815] tracking-tight">
              {stats.totalLembaga.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs text-[#6A7770]">Terverifikasi Kemenag</p>
          </div>
          <div className="bg-white border border-slate-900/10 rounded-2xl p-6 shadow-xs hover:border-[#0F5132]/30 transition-colors">
            <div className="flex items-center justify-between text-[#6A7770]">
              <span className="text-xs font-medium uppercase tracking-wider">Total Santri</span>
              <Users className="w-4 h-4 text-[#0F5132]" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono-num text-[#111815] tracking-tight">
              {stats.totalSantri.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs text-[#6A7770]">Mukim &amp; Non-Mukim</p>
          </div>
          <div className="bg-white border border-slate-900/10 rounded-2xl p-6 shadow-xs hover:border-[#0F5132]/30 transition-colors">
            <div className="flex items-center justify-between text-[#6A7770]">
              <span className="text-xs font-medium uppercase tracking-wider">Tenaga Pendidik</span>
              <BookOpen className="w-4 h-4 text-[#0F5132]" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono-num text-[#111815] tracking-tight">
              {stats.totalPendidik.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs text-[#6A7770]">Ustadz &amp; Ustadzah</p>
          </div>
          <div className="bg-white border border-slate-900/10 rounded-2xl p-6 shadow-xs hover:border-[#0F5132]/30 transition-colors">
            <div className="flex items-center justify-between text-[#6A7770]">
              <span className="text-xs font-medium uppercase tracking-wider">Wilayah Cakupan</span>
              <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
            </div>
            <p className="mt-3 text-3xl font-bold font-mono-num text-[#111815] tracking-tight">
              {stats.coveredKec.toLocaleString('id-ID')}
            </p>
            <p className="mt-1 text-xs text-[#6A7770]">Kecamatan Terdaftar</p>
          </div>
        </section>

        {!directoryEnabled ? (
          <section className="bg-white border border-slate-900/10 rounded-2xl p-12 text-center space-y-3">
            <h2 className="text-xl font-semibold text-[#111815]">Direktori Publik Dinonaktifkan Sementara</h2>
            <p className="text-sm text-[#4B5751] max-w-lg mx-auto">
              Akses direktori publik sedang ditutup oleh admin Kemenag Kabupaten. Operator dan admin tetap dapat masuk melalui Portal Pendataan.
            </p>
          </section>
        ) : (
          <div className="space-y-8">
            {/* Tab Navigation Switcher */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-900/10 pb-4">
              <button
                type="button"
                onClick={() => setActiveTab('direktori')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === 'direktori'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'bg-white text-[#4B5751] hover:bg-slate-100 border border-slate-900/10'
                }`}
              >
                Direktori Lembaga ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('peta')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === 'peta'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'bg-white text-[#4B5751] hover:bg-slate-100 border border-slate-900/10'
                }`}
              >
                Peta Sebaran
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rekap')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === 'rekap'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'bg-white text-[#4B5751] hover:bg-slate-100 border border-slate-900/10'
                }`}
              >
                Rekapitulasi Kecamatan
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ketentuan')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === 'ketentuan'
                    ? 'bg-[#0F5132] text-white shadow-xs'
                    : 'bg-white text-[#4B5751] hover:bg-slate-100 border border-slate-900/10'
                }`}
              >
                Informasi &amp; Legalitas
              </button>
            </div>

            {/* TAB 1: DIREKTORI */}
            {activeTab === 'direktori' && (
              <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-900/10 rounded-2xl p-6">
                  <div>
                    <h2 className="text-xl font-semibold text-[#111815]">Pencarian &amp; Direktori Pesantren</h2>
                    <p className="text-sm text-[#4B5751]">
                      Gunakan filter pencarian berdasarkan nama, NSPP, wilayah kecamatan, atau tipe lembaga.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-[#6A7770] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        aria-label="Cari pesantren"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama, NSPP, pimpinan..."
                        className="pl-10 pr-4 py-2.5 text-sm bg-[#F8FAF9] border border-slate-900/15 rounded-xl focus:border-[#0F5132] focus:outline-none w-64 shadow-xs"
                      />
                    </div>
                    <select
                      aria-label="Filter kecamatan"
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="px-3.5 py-2.5 text-sm bg-[#F8FAF9] border border-slate-900/15 rounded-xl focus:border-[#0F5132] focus:outline-none shadow-xs"
                    >
                      <option value="ALL">Semua Kecamatan</option>
                      {KECAMATAN_OPTIONS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter tipe pesantren"
                      value={tipe}
                      onChange={(e) => setTipe(e.target.value)}
                      className="px-3.5 py-2.5 text-sm bg-[#F8FAF9] border border-slate-900/15 rounded-xl focus:border-[#0F5132] focus:outline-none shadow-xs"
                    >
                      <option value="ALL">Semua Tipe</option>
                      <option value="Salafiyah">Salafiyah</option>
                      <option value="Khalafiyah/Modern">Khalafiyah/Modern</option>
                      <option value="Kombinasi">Kombinasi</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="bg-white border border-slate-900/10 rounded-2xl p-8 space-y-4">
                    <div className="h-6 bg-slate-100 rounded-lg w-1/3 animate-pulse" />
                    <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="bg-white border border-slate-900/10 rounded-2xl p-12 text-center space-y-4">
                    <p className="text-base font-semibold text-[#111815]">
                      {items.length === 0
                        ? 'Belum ada data pesantren yang dipublikasikan.'
                        : 'Tidak ada pesantren yang cocok dengan kriteria pencarian.'}
                    </p>
                    <p className="text-sm text-[#4B5751] max-w-md mx-auto">
                      {items.length === 0
                        ? 'Admin Kemenag dapat masuk ke portal untuk memuat data contoh atau memasukkan data lembaga baru.'
                        : 'Coba ubah kata kunci pencarian atau reset filter wilayah.'}
                    </p>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setKecamatan('ALL');
                          setTipe('ALL');
                        }}
                        className="px-4 py-2 text-sm font-medium text-[#0F5132] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                      >
                        Reset Filter Pencarian
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby="dir-table-caption"
                    className="bg-white border border-slate-900/10 rounded-2xl overflow-hidden shadow-xs"
                  >
                    <table className="w-full text-left text-sm">
                      <caption id="dir-table-caption" className="sr-only">
                        Direktori Pondok Pesantren Terverifikasi
                      </caption>
                      <thead className="bg-[#F8FAF9] text-xs font-semibold text-[#4B5751] border-b border-slate-900/10">
                        <tr>
                          <th className="py-4 px-6">Nama Pesantren &amp; Pimpinan</th>
                          <th className="py-4 px-6">NSPP</th>
                          <th className="py-4 px-6">Wilayah</th>
                          <th className="py-4 px-6">Tipe</th>
                          <th className="py-4 px-6">Status IJOP</th>
                          <th className="py-4 px-6 text-right">Santri</th>
                          <th className="py-4 px-6 text-right">Pendidik</th>
                          <th className="py-4 px-6 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/5">
                        {filtered.map((item) => (
                          <tr key={item.id} className="hover:bg-[#F8FAF9]/80 transition-colors">
                            <td className="py-4 px-6 font-medium text-[#111815]">
                              <div className="font-semibold">{item.nama}</div>
                              <div className="text-xs font-normal text-[#6A7770] mt-0.5">
                                Pengasuh: {item.namaPimpinan}
                              </div>
                            </td>
                            <td className="py-4 px-6 font-mono-num text-xs text-[#4B5751]">
                              {item.nspp || '-'}
                            </td>
                            <td className="py-4 px-6 text-[#4B5751]">
                              <div className="font-medium">{item.kecamatan}</div>
                              <div className="text-xs text-[#6A7770]">{item.desa}</div>
                            </td>
                            <td className="py-4 px-6 text-[#4B5751]">{item.tipe}</td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center text-xs font-medium ${
                                  item.ijopStatusSummary === 'kedaluwarsa'
                                    ? 'text-red-700'
                                    : item.ijopStatusSummary === 'segera_berakhir'
                                      ? 'text-amber-700'
                                      : 'text-[#0F5132]'
                                }`}
                              >
                                {IJOP_LABELS[item.ijopStatusSummary]}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-mono-num font-semibold">
                              {item.totalSantriLatest.toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6 text-right font-mono-num">
                              {item.totalPendidikLatest.toLocaleString('id-ID')}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedId(item.id)}
                                className="px-3.5 py-1.5 text-xs font-medium text-[#0F5132] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* TAB 2: PETA SEBARAN */}
            {activeTab === 'peta' && (
              <section className="bg-white border border-slate-900/10 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-[#111815]">Peta Sebaran Geografis Pesantren</h2>
                    <p className="text-sm text-[#4B5751]">
                      Visualisasi titik koordinat lembaga di wilayah {kabupatenNama}. Klik penanda untuk melihat ringkasan singkat.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#4B5751]">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> IJOP Aktif</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Segera Berakhir</span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Kedaluwarsa</span>
                  </div>
                </div>
                <div className="h-[520px] rounded-xl overflow-hidden border border-slate-900/10">
                  <PesantrenMap
                    items={filtered}
                    selectedId={selectedId}
                    onSelect={(id) => setSelectedId(id)}
                  />
                </div>
              </section>
            )}

            {/* TAB 3: REKAPITULASI KECAMATAN */}
            {activeTab === 'rekap' && (
              <section className="space-y-6">
                <div className="bg-white border border-slate-900/10 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold text-[#111815]">Rekapitulasi Sebaran per Kecamatan</h2>
                  <p className="text-sm text-[#4B5751]">
                    Akumulasi jumlah lembaga dan total santri terdaftar di setiap kecamatan.
                  </p>
                </div>
                {kecamatanSummary.length === 0 ? (
                  <div className="bg-white border border-slate-900/10 rounded-2xl p-12 text-center">
                    <p className="text-sm text-[#4B5751]">Belum ada data rekapitulasi wilayah.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {kecamatanSummary.map(([kec, data]) => (
                      <div key={kec} className="bg-white border border-slate-900/10 rounded-2xl p-6 space-y-3 shadow-xs hover:border-[#0F5132]/30 transition-colors">
                        <p className="text-base font-semibold text-[#111815]">{kec}</p>
                        <div className="flex items-baseline justify-between text-xs text-[#6A7770] border-t border-slate-900/5 pt-3">
                          <span>Total Lembaga</span>
                          <span className="font-mono-num font-semibold text-[#111815] text-sm">{data.lembaga}</span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs text-[#6A7770]">
                          <span>Total Santri</span>
                          <span className="font-mono-num font-semibold text-[#0F5132] text-sm">{data.santri.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* TAB 4: KETENTUAN & LEGALITAS */}
            {activeTab === 'ketentuan' && (
              <section className="bg-white border border-slate-900/10 rounded-2xl p-8 space-y-6 max-w-4xl shadow-xs">
                <div>
                  <h2 className="text-xl font-semibold text-[#111815]">Ketentuan Pendataan &amp; Legalitas IJOP</h2>
                  <p className="text-sm text-[#4B5751] mt-1">
                    Informasi resmi mengenai standar operasional prosedur dan verifikasi Kementerian Agama.
                  </p>
                </div>
                <div className="space-y-4 text-sm text-[#4B5751] leading-relaxed">
                  <p>
                    Setiap Pondok Pesantren yang beroperasi di wilayah <strong className="text-[#111815]">{kabupatenNama}</strong> wajib memiliki Izin Operasional (IJOP) yang diterbitkan secara resmi oleh Direktorat Jenderal Pendidikan Islam Kementerian Agama Republik Indonesia.
                  </p>
                  <p>
                    Portal <strong>SimPoren Kemenag</strong> berfungsi sebagai sistem pendataan terpusat untuk memperbaharui profil kelembagaan, laporan berkala santri dan pendidik, serta pemantauan masa berlaku SK IJOP secara transparan.
                  </p>
                  <div className="bg-[#F8FAF9] border border-slate-900/10 rounded-xl p-5 space-y-2">
                    <p className="font-semibold text-[#111815]">Status Verifikasi Resmi:</p>
                    <p className="text-xs text-[#6A7770]">
                      Lembaga yang ditampilkan dalam direktori publik ini telah melalui tahapan verifikasi berkas dan peninjauan lapangan oleh tim verifikator Kemenag Kabupaten.
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* Quiet Footer */}
        <footer className="border-t border-slate-900/10 pt-8 pb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-[#6A7770]">
            <p>
              &copy; 2026 Kementerian Agama Republik Indonesia · Sistem Pendataan Pondok Pesantren ({kabupatenNama}).
            </p>
            <div className="flex items-center gap-6">
              <span>Keamanan Data Terenkripsi</span>
              <span aria-hidden="true">·</span>
              <span>Standar Integrasi Kemenag</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Detail Native <dialog> */}
      <dialog
        ref={detailDialogRef}
        aria-labelledby="public-detail-title"
        onCancel={(e) => {
          e.preventDefault();
          setSelectedId(null);
        }}
        className="m-auto w-full max-w-lg rounded-2xl border border-slate-900/10 bg-white p-8 text-[#111815] shadow-2xl backdrop:bg-black/50"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-900/10">
              <div>
                <p className="text-xs font-medium text-[#0F5132] tracking-wide">
                  {selectedItem.tipe} · NSPP {selectedItem.nspp || '-'}
                </p>
                <h2 id="public-detail-title" className="mt-1 text-2xl font-bold tracking-tight">
                  {selectedItem.nama}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Tutup detail"
                onClick={() => setSelectedId(null)}
                className="p-2 text-slate-400 hover:text-[#111815] rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <dt className="text-xs text-[#6A7770]">Pimpinan / Pengasuh</dt>
                <dd className="mt-1 font-semibold text-[#111815]">{selectedItem.namaPimpinan}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#6A7770]">Tahun Berdiri</dt>
                <dd className="mt-1 font-mono-num font-semibold text-[#111815]">{selectedItem.tahunBerdiri}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#6A7770]">Kecamatan &amp; Desa</dt>
                <dd className="mt-1 font-medium text-[#111815]">{selectedItem.kecamatan}, {selectedItem.desa}</dd>
              </div>
              <div>
                <dt className="text-xs text-[#6A7770]">Status Legalitas IJOP</dt>
                <dd className="mt-1 font-semibold text-[#0F5132]">
                  {IJOP_LABELS[selectedItem.ijopStatusSummary]}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#6A7770]">Jumlah Santri</dt>
                <dd className="mt-1 font-mono-num font-semibold text-[#111815]">
                  {selectedItem.totalSantriLatest.toLocaleString('id-ID')} Santri
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#6A7770]">Tenaga Pendidik</dt>
                <dd className="mt-1 font-mono-num font-semibold text-[#111815]">
                  {selectedItem.totalPendidikLatest.toLocaleString('id-ID')} Pendidik
                </dd>
              </div>
            </dl>

            <div className="flex items-start gap-2.5 text-sm text-[#4B5751] bg-[#F8FAF9] p-4 rounded-xl border border-slate-900/5">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#0F5132]" />
              <span>{selectedItem.alamat}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                autoFocus
                onClick={() => setSelectedId(null)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-xl transition-colors shadow-xs"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
