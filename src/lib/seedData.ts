import type {
  BangunanKelayakan,
  LegalitasStatus,
  PesantrenTipe,
  TanahStatus,
  VerificationStatus,
} from '../types';
import { computeIjopStatus } from './domain';

export interface SeedPesantrenItem {
  id: string;
  nama: string;
  nspp: string;
  alamat: string;
  kecamatan: string;
  desa: string;
  telepon: string;
  email: string;
  namaPimpinan: string;
  tahunBerdiri: number;
  tipe: PesantrenTipe;
  lat: number;
  lng: number;
  verificationStatus: VerificationStatus;
  catatanRevisi?: string;
  nomorIjop: string;
  tanggalTerbit: string;
  tanggalBerakhir: string;
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
}

export const DUMMY_PESANTREN_SEED: SeedPesantrenItem[] = [
  {
    id: 'ps_darul_hikmah_kota',
    nama: 'Pondok Pesantren Darul Hikmah',
    nspp: '510035040012',
    alamat: 'Jl. Ki Mangunsarkoro No. 48, Kelurahan Tamanan',
    kecamatan: 'Kec. Kota',
    desa: 'Tamanan',
    telepon: '0355-321450',
    email: 'sekretariat@darulhikmah.example.id',
    namaPimpinan: 'KH. Abdurrahman Wahiduddin',
    tahunBerdiri: 1984,
    tipe: 'Kombinasi',
    lat: -8.0658,
    lng: 111.9012,
    verificationStatus: 'disetujui',
    nomorIjop: 'Kd.13.04/5/PP.00.7/102/2023',
    tanggalTerbit: '2023-03-15',
    tanggalBerakhir: '2028-03-15',
    santriLaki: 340,
    santriPerempuan: 295,
    santriMukim: 520,
    santriNonMukim: 115,
    santriLokal: 410,
    santriLuarKabupaten: 225,
    ustadzCount: 28,
    ustadzahCount: 22,
    pendidikS1KeAtas: 38,
    pendidikTetap: 40,
    pendidikTidakTetap: 10,
    luasTanahM2: 6800,
    luasBangunanM2: 4150,
    jumlahAsrama: 14,
    jumlahRuangBelajar: 18,
    jumlahMushola: 2,
    jumlahToilet: 36,
    statusTanah: 'Wakaf',
    kelayakanBangunan: 'Layak',
  },
  {
    id: 'ps_nurul_iman_ngunut',
    nama: 'Pondok Pesantren Nurul Iman',
    nspp: '510035040028',
    alamat: 'Dusun Krajan RT 02 RW 01, Desa Sumberingin Kidul',
    kecamatan: 'Kec. Ngunut',
    desa: 'Sumberingin Kidul',
    telepon: '0355-395118',
    email: 'operator@nuruliman.example.id',
    namaPimpinan: 'K. Ahmad Syafiuddin',
    tahunBerdiri: 1996,
    tipe: 'Salafiyah',
    lat: -8.1216,
    lng: 112.0114,
    verificationStatus: 'disetujui',
    nomorIjop: 'Kd.13.04/5/PP.00.7/044/2022',
    tanggalTerbit: '2022-01-10',
    tanggalBerakhir: '2027-01-10',
    santriLaki: 215,
    santriPerempuan: 180,
    santriMukim: 360,
    santriNonMukim: 35,
    santriLokal: 290,
    santriLuarKabupaten: 105,
    ustadzCount: 19,
    ustadzahCount: 14,
    pendidikS1KeAtas: 18,
    pendidikTetap: 26,
    pendidikTidakTetap: 7,
    luasTanahM2: 4200,
    luasBangunanM2: 2450,
    jumlahAsrama: 9,
    jumlahRuangBelajar: 10,
    jumlahMushola: 1,
    jumlahToilet: 22,
    statusTanah: 'Milik Yayasan',
    kelayakanBangunan: 'Perlu Perbaikan Ringan',
  },
  {
    id: 'ps_al_falah_sumbergempol',
    nama: 'Pondok Pesantren Modern Al-Falah',
    nspp: '510035040045',
    alamat: 'Jl. Raya Sumbergempol Km. 4, Desa Bendiljati Wetan',
    kecamatan: 'Kec. Sumbergempol',
    desa: 'Bendiljati Wetan',
    telepon: '0355-332890',
    email: 'admin@alfalahmodern.example.id',
    namaPimpinan: 'Ust. H. Miftahul Huda, M.Pd.I',
    tahunBerdiri: 2008,
    tipe: 'Khalafiyah/Modern',
    lat: -8.0842,
    lng: 111.9645,
    verificationStatus: 'diajukan',
    nomorIjop: 'Kd.13.04/5/PP.00.7/219/2021',
    tanggalTerbit: '2021-10-01',
    tanggalBerakhir: '2026-10-01',
    santriLaki: 280,
    santriPerempuan: 310,
    santriMukim: 540,
    santriNonMukim: 50,
    santriLokal: 350,
    santriLuarKabupaten: 240,
    ustadzCount: 24,
    ustadzahCount: 26,
    pendidikS1KeAtas: 44,
    pendidikTetap: 42,
    pendidikTidakTetap: 8,
    luasTanahM2: 8500,
    luasBangunanM2: 5200,
    jumlahAsrama: 16,
    jumlahRuangBelajar: 20,
    jumlahMushola: 2,
    jumlahToilet: 44,
    statusTanah: 'Milik Yayasan',
    kelayakanBangunan: 'Layak',
  },
  {
    id: 'ps_miftahul_uloom_boyolangu',
    nama: 'Pondok Pesantren Miftahul Uloom',
    nspp: '510035040061',
    alamat: 'Jl. Mastrip Timur No. 17, Desa Serut',
    kecamatan: 'Kec. Boyolangu',
    desa: 'Serut',
    telepon: '0355-327712',
    email: 'tu@miftahululoom.example.id',
    namaPimpinan: 'KH. Zainal Arifin',
    tahunBerdiri: 1979,
    tipe: 'Salafiyah',
    lat: -8.1055,
    lng: 111.8942,
    verificationStatus: 'ditolak',
    catatanRevisi: 'Mohon perbarui nomor SK IJOP perpanjangan terbaru dan lengkapi jumlah toilet asrama putri.',
    nomorIjop: 'Kd.13.04/5/PP.00.7/015/2021',
    tanggalTerbit: '2021-05-12',
    tanggalBerakhir: '2026-05-12',
    santriLaki: 145,
    santriPerempuan: 130,
    santriMukim: 230,
    santriNonMukim: 45,
    santriLokal: 240,
    santriLuarKabupaten: 35,
    ustadzCount: 14,
    ustadzahCount: 10,
    pendidikS1KeAtas: 12,
    pendidikTetap: 20,
    pendidikTidakTetap: 4,
    luasTanahM2: 3100,
    luasBangunanM2: 1850,
    jumlahAsrama: 6,
    jumlahRuangBelajar: 8,
    jumlahMushola: 1,
    jumlahToilet: 14,
    statusTanah: 'Wakaf',
    kelayakanBangunan: 'Perlu Renovasi Berat',
  },
];

export function buildSeedLegalitasStatus(tanggalBerakhir: string): LegalitasStatus {
  const status = computeIjopStatus(tanggalBerakhir);
  return status === 'belum_ada' ? 'proses_perpanjangan' : status;
}
