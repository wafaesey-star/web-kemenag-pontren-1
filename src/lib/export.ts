import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { DataPeriodik, Legalitas, Pesantren } from '../types';
import { IJOP_LABELS, STATUS_LABELS, sanitizeSpreadsheetCell } from './domain';

export interface ExportRow {
  pesantren: Pesantren;
  legalitas?: Legalitas | null;
  periodik?: DataPeriodik | null;
}

export function exportPesantrenExcel(
  rows: ExportRow[],
  kabupatenNama: string,
  periodeLabel: string,
) {
  const data = rows.map(({ pesantren, legalitas, periodik }, idx) => ({
    No: idx + 1,
    Nama_Pesantren: sanitizeSpreadsheetCell(pesantren.nama),
    NSPP: sanitizeSpreadsheetCell(pesantren.nspp || '-'),
    Tipe: sanitizeSpreadsheetCell(pesantren.tipe),
    Kecamatan: sanitizeSpreadsheetCell(pesantren.kecamatan),
    Desa: sanitizeSpreadsheetCell(pesantren.desa),
    Pimpinan: sanitizeSpreadsheetCell(pesantren.namaPimpinan),
    Status_Keaktifan: sanitizeSpreadsheetCell(pesantren.statusKeaktifan),
    Status_Verifikasi: sanitizeSpreadsheetCell(STATUS_LABELS[pesantren.verificationStatus]),
    Nomor_IJOP: sanitizeSpreadsheetCell(legalitas?.nomorIjop || '-'),
    Status_IJOP: sanitizeSpreadsheetCell(IJOP_LABELS[pesantren.ijopStatusSummary]),
    Berakhir_IJOP: sanitizeSpreadsheetCell(legalitas?.tanggalBerakhir || pesantren.ijopExpiredAt || '-'),
    Santri_Laki: periodik?.santriLaki ?? 0,
    Santri_Perempuan: periodik?.santriPerempuan ?? 0,
    Total_Santri: periodik ? periodik.santriLaki + periodik.santriPerempuan : pesantren.totalSantriLatest,
    Santri_Mukim: periodik?.santriMukim ?? 0,
    Total_Pendidik: periodik ? periodik.ustadzCount + periodik.ustadzahCount : pesantren.totalPendidikLatest,
    Ruang_Belajar: periodik?.jumlahRuangBelajar ?? 0,
    Kelayakan_Bangunan: sanitizeSpreadsheetCell(periodik?.kelayakanBangunan || '-'),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Pesantren');
  const safeSlug = periodeLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Rekap_Pesantren_${kabupatenNama.replace(/\s+/g, '_')}_${safeSlug}.xlsx`);
}

export function exportPesantrenPdf(
  rows: ExportRow[],
  kabupatenNama: string,
  periodeLabel: string,
  kecamatanFilter: string,
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(13);
  doc.text(`KEMENTERIAN AGAMA — ${kabupatenNama.toUpperCase()}`, 14, 14);
  doc.setFontSize(10);
  doc.text(
    `Laporan Rekapitulasi Pondok Pesantren · Periode: ${periodeLabel}${kecamatanFilter !== 'ALL' ? ` · ${kecamatanFilter}` : ''}`,
    14,
    20,
  );

  const totalSantri = rows.reduce(
    (sum, r) =>
      sum + (r.periodik ? r.periodik.santriLaki + r.periodik.santriPerempuan : r.pesantren.totalSantriLatest),
    0,
  );
  const totalPendidik = rows.reduce(
    (sum, r) =>
      sum + (r.periodik ? r.periodik.ustadzCount + r.periodik.ustadzahCount : r.pesantren.totalPendidikLatest),
    0,
  );

  doc.setFontSize(9);
  doc.text(
    `Total Lembaga: ${rows.length} · Total Santri: ${totalSantri.toLocaleString('id-ID')} · Total Pendidik: ${totalPendidik.toLocaleString('id-ID')}`,
    14,
    26,
  );

  autoTable(doc, {
    startY: 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 81, 50] },
    head: [
      ['No', 'Nama Pesantren', 'NSPP', 'Kecamatan', 'Tipe', 'Status', 'IJOP', 'Santri', 'Pendidik', 'Sarpras'],
    ],
    body: rows.map(({ pesantren, legalitas, periodik }, idx) => [
      idx + 1,
      pesantren.nama,
      pesantren.nspp || '-',
      pesantren.kecamatan,
      pesantren.tipe,
      STATUS_LABELS[pesantren.verificationStatus],
      legalitas?.nomorIjop ? `${legalitas.nomorIjop} (${IJOP_LABELS[pesantren.ijopStatusSummary]})` : IJOP_LABELS[pesantren.ijopStatusSummary],
      periodik ? periodik.santriLaki + periodik.santriPerempuan : pesantren.totalSantriLatest,
      periodik ? periodik.ustadzCount + periodik.ustadzahCount : pesantren.totalPendidikLatest,
      periodik ? `${periodik.jumlahRuangBelajar} R.Belajar` : '-',
    ]),
  });

  const safeSlug = periodeLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Laporan_Pesantren_${kabupatenNama.replace(/\s+/g, '_')}_${safeSlug}.pdf`);
}
