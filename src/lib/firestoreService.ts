import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { OperationType, handleFirestoreError } from '../firebase';
import {
  type BangunanKelayakan,
  type DataPeriodik,
  type Legalitas,
  type Pesantren,
  type PesantrenTipe,
  type StatusKeaktifan,
  type SystemConfig,
  type TanahStatus,
  type UserProfile,
  type VerificationStatus,
} from '../types';
import { computeIjopStatus, makeSafeDocId } from './domain';
import { DUMMY_PESANTREN_SEED, buildSeedLegalitasStatus } from './seedData';

export interface SavePesantrenPayload {
  pesantrenId: string;
  isNew: boolean;
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
  statusKeaktifan: StatusKeaktifan;
  lat: number;
  lng: number;
  existing?: Pesantren | null;
  // Legalitas
  nomorIjop: string;
  tanggalTerbit: string;
  tanggalBerakhir: string;
  dokumenUrl: string;
  dokumenNama: string;
  legalitasCatatan: string;
  hasExistingLegalitas: boolean;
  // Data Periodik
  tahunAjaran: string;
  hasExistingPeriodik: boolean;
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

export async function savePesantrenBundle(
  db: Firestore,
  user: UserProfile,
  payload: SavePesantrenPayload,
) {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const totalSantriLatest = payload.santriLaki + payload.santriPerempuan;
  const totalPendidikLatest = payload.ustadzCount + payload.ustadzahCount;
  const ijopStatusSummary = payload.nomorIjop.trim()
    ? computeIjopStatus(payload.tanggalBerakhir)
    : 'belum_ada';

  const pesantrenRef = doc(db, 'pesantren', payload.pesantrenId);
  const pesantrenData = {
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
    updatedAt: now,
  };

  if (payload.isNew) {
    batch.set(pesantrenRef, {
      ...pesantrenData,
      verificationStatus: 'draft' as VerificationStatus,
      catatanRevisi: '',
      assignedOperatorUids: [],
      assignedOperatorEmails: [],
      createdByUid: user.uid,
      createdAt: now,
    });
  } else {
    batch.update(pesantrenRef, pesantrenData);
  }

  // Sync public projection automatically when Kemenag updates an already-approved & active record
  if (
    user.role === 'super_admin' &&
    payload.existing?.verificationStatus === 'disetujui'
  ) {
    const publicRef = doc(db, 'public_pesantren', payload.pesantrenId);
    if (payload.statusKeaktifan === 'aktif') {
      batch.set(publicRef, {
        nama: pesantrenData.nama,
        nspp: pesantrenData.nspp,
        alamat: pesantrenData.alamat,
        kecamatan: pesantrenData.kecamatan,
        desa: pesantrenData.desa,
        namaPimpinan: pesantrenData.namaPimpinan,
        tahunBerdiri: pesantrenData.tahunBerdiri,
        tipe: pesantrenData.tipe,
        statusKeaktifan: 'aktif',
        lat: pesantrenData.lat,
        lng: pesantrenData.lng,
        ijopStatusSummary,
        totalSantriLatest,
        totalPendidikLatest,
        updatedAt: now,
      });
    } else {
      batch.delete(publicRef);
    }
  }

  if (payload.nomorIjop.trim() && payload.tanggalTerbit && payload.tanggalBerakhir) {
    const legalitasRef = doc(db, 'legalitas', payload.pesantrenId);
    const statusLegalitas =
      ijopStatusSummary === 'belum_ada' ? 'proses_perpanjangan' : ijopStatusSummary;
    const legalitasBody = {
      pesantrenId: payload.pesantrenId,
      nomorIjop: payload.nomorIjop.trim(),
      tanggalTerbit: payload.tanggalTerbit,
      tanggalBerakhir: payload.tanggalBerakhir,
      statusLegalitas,
      dokumenUrl: payload.dokumenUrl.trim(),
      dokumenNama: payload.dokumenNama.trim(),
      catatan: payload.legalitasCatatan.trim(),
      updatedByUid: user.uid,
      updatedAt: now,
    };
    if (payload.hasExistingLegalitas) {
      batch.update(legalitasRef, legalitasBody);
    } else {
      batch.set(legalitasRef, { ...legalitasBody, createdAt: now });
    }

    const histId = makeSafeDocId('lh', `${payload.pesantrenId}_${Date.now()}`);
    batch.set(doc(db, 'legalitas_history', histId), {
      pesantrenId: payload.pesantrenId,
      nomorIjop: payload.nomorIjop.trim(),
      tanggalTerbit: payload.tanggalTerbit,
      tanggalBerakhir: payload.tanggalBerakhir,
      statusLegalitas,
      dokumenUrl: payload.dokumenUrl.trim(),
      changedByUid: user.uid,
      changedByEmail: user.email,
      createdAt: now,
    });
  }

  const periodDocId = makeSafeDocId('dp', `${payload.pesantrenId}_${payload.tahunAjaran}`);
  const periodRef = doc(db, 'data_periodik', periodDocId);
  const periodBody = {
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
    updatedByUid: user.uid,
    updatedAt: now,
  };
  if (payload.hasExistingPeriodik) {
    batch.update(periodRef, periodBody);
  } else {
    batch.set(periodRef, { ...periodBody, createdAt: now });
  }

  const auditId = makeSafeDocId('aud', `${payload.pesantrenId}_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    actorUid: user.uid,
    actorEmail: user.email,
    actorRole: user.role,
    action: payload.isNew ? 'CREATE_PESANTREN' : 'UPDATE_PESANTREN_DATA',
    targetType: 'pesantren',
    targetId: payload.pesantrenId,
    summary: `${payload.isNew ? 'Menambahkan' : 'Memperbarui'} data ${payload.nama.trim()} (${payload.tahunAjaran})`,
    createdAt: now,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `pesantren/${payload.pesantrenId}`);
  }
}

export async function transitionPesantrenStatus(
  db: Firestore,
  user: UserProfile,
  pesantren: Pesantren,
  toStatus: VerificationStatus,
  catatanRevisi = '',
) {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const pesantrenRef = doc(db, 'pesantren', pesantren.id);

  if (user.role === 'operator') {
    batch.update(pesantrenRef, {
      verificationStatus: toStatus,
      updatedAt: now,
    });
  } else {
    batch.update(pesantrenRef, {
      verificationStatus: toStatus,
      catatanRevisi: catatanRevisi.trim(),
      updatedAt: now,
    });

    const publicRef = doc(db, 'public_pesantren', pesantren.id);
    if (toStatus === 'disetujui' && pesantren.statusKeaktifan === 'aktif') {
      batch.set(publicRef, {
        nama: pesantren.nama,
        nspp: pesantren.nspp || '',
        alamat: pesantren.alamat,
        kecamatan: pesantren.kecamatan,
        desa: pesantren.desa,
        namaPimpinan: pesantren.namaPimpinan,
        tahunBerdiri: pesantren.tahunBerdiri,
        tipe: pesantren.tipe,
        statusKeaktifan: 'aktif',
        lat: pesantren.lat,
        lng: pesantren.lng,
        ijopStatusSummary: pesantren.ijopStatusSummary,
        totalSantriLatest: pesantren.totalSantriLatest,
        totalPendidikLatest: pesantren.totalPendidikLatest,
        updatedAt: now,
      });
    } else if (toStatus === 'draft' || toStatus === 'ditolak') {
      batch.delete(publicRef);
    }
  }

  const verLogId = makeSafeDocId('vl', `${pesantren.id}_${Date.now()}`);
  batch.set(doc(db, 'verifikasi_logs', verLogId), {
    pesantrenId: pesantren.id,
    pesantrenNama: pesantren.nama,
    fromStatus: pesantren.verificationStatus,
    toStatus,
    catatanRevisi: catatanRevisi.trim(),
    actorUid: user.uid,
    actorEmail: user.email,
    actorRole: user.role,
    createdAt: now,
  });

  const auditId = makeSafeDocId('aud', `status_${pesantren.id}_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    actorUid: user.uid,
    actorEmail: user.email,
    actorRole: user.role,
    action: `VERIFY_${toStatus.toUpperCase()}`,
    targetType: 'pesantren',
    targetId: pesantren.id,
    summary: `Status ${pesantren.nama}: ${pesantren.verificationStatus} -> ${toStatus}${catatanRevisi.trim() ? ` (${catatanRevisi.trim()})` : ''}`,
    createdAt: now,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `pesantren/${pesantren.id}`);
  }
}

export async function assignOperatorToPesantren(
  db: Firestore,
  admin: UserProfile,
  input: {
    email: string;
    fullName: string;
    phone: string;
    pesantren: Pesantren;
    existingInviteId?: string;
    existingAssignedPesantrenIds?: string[];
    existingLinkedUid?: string;
  },
) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const inviteId = input.existingInviteId || makeSafeDocId('inv', normalizedEmail);
  const batch = writeBatch(db);
  const now = serverTimestamp();

  const nextAssignedIds = Array.from(
    new Set([...(input.existingAssignedPesantrenIds || []), input.pesantren.id]),
  ).slice(0, 10);

  const inviteRef = doc(db, 'operator_invites', inviteId);
  if (input.existingInviteId) {
    batch.update(inviteRef, {
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      isActive: true,
      assignedPesantrenIds: nextAssignedIds,
      updatedAt: now,
    });
  } else {
    batch.set(inviteRef, {
      email: normalizedEmail,
      fullName: input.fullName.trim(),
      phone: input.phone.trim(),
      isActive: true,
      assignedPesantrenIds: nextAssignedIds,
      linkedUid: '',
      createdByUid: admin.uid,
      createdAt: now,
      updatedAt: now,
    });
  }

  const nextEmails = Array.from(
    new Set([...input.pesantren.assignedOperatorEmails.map((e) => e.toLowerCase()), normalizedEmail]),
  ).slice(0, 10);
  const nextUids = input.existingLinkedUid
    ? Array.from(new Set([...input.pesantren.assignedOperatorUids, input.existingLinkedUid])).slice(0, 10)
    : input.pesantren.assignedOperatorUids;

  batch.update(doc(db, 'pesantren', input.pesantren.id), {
    assignedOperatorEmails: nextEmails,
    assignedOperatorUids: nextUids,
    updatedAt: now,
  });

  const assignId = makeSafeDocId('asg', `${input.pesantren.id}_${Date.now()}`);
  batch.set(doc(db, 'operator_assignments', assignId), {
    pesantrenId: input.pesantren.id,
    pesantrenNama: input.pesantren.nama,
    operatorEmail: normalizedEmail,
    operatorUid: input.existingLinkedUid || '',
    operatorName: input.fullName.trim(),
    status: 'aktif',
    assignedByUid: admin.uid,
    createdAt: now,
    updatedAt: now,
  });

  const auditId = makeSafeDocId('aud', `assign_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    actorUid: admin.uid,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: 'ASSIGN_OPERATOR',
    targetType: 'operator_assignments',
    targetId: assignId,
    summary: `Menugaskan operator ${normalizedEmail} ke ${input.pesantren.nama}`,
    createdAt: now,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'operator_assignments');
  }
}

export async function toggleOperatorActive(
  db: Firestore,
  admin: UserProfile,
  inviteId: string,
  email: string,
  linkedUid: string | undefined,
  nextActive: boolean,
) {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  batch.update(doc(db, 'operator_invites', inviteId), {
    isActive: nextActive,
    updatedAt: now,
  });

  if (linkedUid) {
    batch.update(doc(db, 'users', linkedUid), {
      isActive: nextActive,
      updatedAt: now,
    });
  }

  const auditId = makeSafeDocId('aud', `op_toggle_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    actorUid: admin.uid,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: nextActive ? 'ACTIVATE_OPERATOR' : 'DEACTIVATE_OPERATOR',
    targetType: 'operator_invites',
    targetId: inviteId,
    summary: `${nextActive ? 'Mengaktifkan' : 'Menonaktifkan'} akun operator ${email}`,
    createdAt: now,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `operator_invites/${inviteId}`);
  }
}

export async function revokeOperatorFromPesantren(
  db: Firestore,
  admin: UserProfile,
  pesantren: Pesantren,
  operatorEmail: string,
  operatorUid?: string,
) {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const normalized = operatorEmail.toLowerCase();

  batch.update(doc(db, 'pesantren', pesantren.id), {
    assignedOperatorEmails: pesantren.assignedOperatorEmails.filter(
      (e) => e.toLowerCase() !== normalized,
    ),
    assignedOperatorUids: operatorUid
      ? pesantren.assignedOperatorUids.filter((u) => u !== operatorUid)
      : pesantren.assignedOperatorUids,
    updatedAt: now,
  });

  const assignSnap = await getDocs(
    query(
      collection(db, 'operator_assignments'),
      where('pesantrenId', '==', pesantren.id),
      where('operatorEmail', '==', normalized),
    ),
  );
  assignSnap.forEach((d) => {
    if (d.data().status === 'aktif') {
      batch.update(d.ref, { status: 'nonaktif', updatedAt: now });
    }
  });

  const auditId = makeSafeDocId('aud', `revoke_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    actorUid: admin.uid,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: 'REVOKE_OPERATOR',
    targetType: 'pesantren',
    targetId: pesantren.id,
    summary: `Mencabut akses ${normalized} dari ${pesantren.nama}`,
    createdAt: now,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `pesantren/${pesantren.id}`);
  }
}

export async function saveSystemConfig(
  db: Firestore,
  admin: UserProfile,
  config: Omit<SystemConfig, 'updatedByUid' | 'updatedAt'>,
) {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  batch.set(doc(db, 'system_config', 'default'), {
    ...config,
    updatedByUid: admin.uid,
    updatedAt: now,
  });

  const auditId = makeSafeDocId('aud', `cfg_${Date.now()}`);
  batch.set(doc(db, 'audit_logs', auditId), {
    actorUid: admin.uid,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: 'UPDATE_CONFIG',
    targetType: 'system_config',
    targetId: 'default',
    summary: `Memperbarui pengaturan kabupaten (${config.kabupatenNama}, periode ${config.activePeriode})`,
    createdAt: now,
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'system_config/default');
  }
}

export async function seedDummyPesantrenData(
  db: Firestore,
  admin: UserProfile,
  activePeriode: string,
) {
  const batch = writeBatch(db);
  const now = serverTimestamp();

  const cleanAdminEmail = admin.email.trim().toLowerCase();
  const demoOperatorEmail = cleanAdminEmail.endsWith('@gmail.com')
    ? cleanAdminEmail.replace(/@gmail\.com$/, '+operator@gmail.com')
    : 'operator.pesantren@contoh.id';
  const assignedIds = ['ps_darul_hikmah_kota', 'ps_miftahul_uloom_boyolangu'];

  for (const item of DUMMY_PESANTREN_SEED) {
    const ijopStatus = computeIjopStatus(item.tanggalBerakhir);
    const totalSantri = item.santriLaki + item.santriPerempuan;
    const totalPendidik = item.ustadzCount + item.ustadzahCount;

    batch.set(doc(db, 'pesantren', item.id), {
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
      assignedOperatorUids: [],
      assignedOperatorEmails: assignedIds.includes(item.id) ? [demoOperatorEmail] : [],
      ijopStatusSummary: ijopStatus,
      ijopExpiredAt: item.tanggalBerakhir,
      totalSantriLatest: totalSantri,
      totalPendidikLatest: totalPendidik,
      createdByUid: admin.uid,
      createdAt: now,
      updatedAt: now,
    });

    if (item.verificationStatus === 'disetujui') {
      batch.set(doc(db, 'public_pesantren', item.id), {
        nama: item.nama,
        nspp: item.nspp,
        alamat: item.alamat,
        kecamatan: item.kecamatan,
        desa: item.desa,
        namaPimpinan: item.namaPimpinan,
        tahunBerdiri: item.tahunBerdiri,
        tipe: item.tipe,
        statusKeaktifan: 'aktif',
        lat: item.lat,
        lng: item.lng,
        ijopStatusSummary: ijopStatus,
        totalSantriLatest: totalSantri,
        totalPendidikLatest: totalPendidik,
        updatedAt: now,
      });
    }

    batch.set(doc(db, 'legalitas', item.id), {
      pesantrenId: item.id,
      nomorIjop: item.nomorIjop,
      tanggalTerbit: item.tanggalTerbit,
      tanggalBerakhir: item.tanggalBerakhir,
      statusLegalitas: buildSeedLegalitasStatus(item.tanggalBerakhir),
      dokumenUrl: '',
      dokumenNama: `SK_IJOP_${item.id}.pdf`,
      catatan: 'Data contoh awal untuk pengujian alur verifikasi.',
      updatedByUid: admin.uid,
      createdAt: now,
      updatedAt: now,
    });

    const dpId = makeSafeDocId('dp', `${item.id}_${activePeriode}`);
    batch.set(doc(db, 'data_periodik', dpId), {
      pesantrenId: item.id,
      tahunAjaran: activePeriode,
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
      updatedByUid: admin.uid,
      createdAt: now,
      updatedAt: now,
    });
  }

  const inviteId = makeSafeDocId('inv', demoOperatorEmail);
  batch.set(doc(db, 'operator_invites', inviteId), {
    email: demoOperatorEmail,
    fullName: 'Operator Contoh Pesantren',
    phone: '081234567890',
    isActive: true,
    assignedPesantrenIds: assignedIds,
    linkedUid: '',
    createdByUid: admin.uid,
    createdAt: now,
    updatedAt: now,
  });

  batch.set(doc(db, 'audit_logs', makeSafeDocId('aud', `seed_${Date.now()}`)), {
    actorUid: admin.uid,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: 'SEED_DUMMY_DATA',
    targetType: 'pesantren',
    targetId: 'batch_seed',
    summary: `Memuat ${DUMMY_PESANTREN_SEED.length} data contoh pesantren & operator ${demoOperatorEmail} untuk periode ${activePeriode}`,
    createdAt: now,
  });

  try {
    await batch.commit();

    // Write operator_assignments after pesantren documents are committed (satisfies rules exists() check)
    const assignBatch = writeBatch(db);
    for (const item of DUMMY_PESANTREN_SEED) {
      if (!assignedIds.includes(item.id)) continue;
      const assignId = makeSafeDocId('asg', `seed_${item.id}`);
      assignBatch.set(doc(db, 'operator_assignments', assignId), {
        pesantrenId: item.id,
        pesantrenNama: item.nama,
        operatorEmail: demoOperatorEmail,
        operatorUid: '',
        operatorName: 'Operator Contoh Pesantren',
        status: 'aktif',
        assignedByUid: admin.uid,
        createdAt: now,
        updatedAt: now,
      });
    }
    await assignBatch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'pesantren');
  }
}

export type { Legalitas, DataPeriodik };
