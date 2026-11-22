import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateCompleteness,
  canAccessPesantren,
  canTransitionVerification,
  computeIjopStatus,
  isSafeHttpsUrl,
  makeSafeDocId,
  sanitizeSpreadsheetCell,
} from './domain.ts';

test('RBAC & Scope Isolation: operator only accesses assigned active pesantren', () => {
  const pesantrenA = {
    assignedOperatorUids: ['uid_op_a'],
    assignedOperatorEmails: ['op.a@pesantren.id'],
  };
  const pesantrenB = {
    assignedOperatorUids: ['uid_op_b'],
    assignedOperatorEmails: ['op.b@pesantren.id'],
  };

  const opA = { uid: 'uid_op_a', email: 'op.a@pesantren.id', role: 'operator' as const, isActive: true };
  const inactiveOp = { ...opA, isActive: false };
  const admin = { uid: 'uid_admin', email: 'wafaesey@gmail.com', role: 'super_admin' as const, isActive: true };

  assert.equal(canAccessPesantren(opA, pesantrenA), true);
  assert.equal(canAccessPesantren(opA, pesantrenB), false); // Negative test
  assert.equal(canAccessPesantren(inactiveOp, pesantrenA), false);
  assert.equal(canAccessPesantren(admin, pesantrenB), true);
  assert.equal(canAccessPesantren(null, pesantrenA), false);
});

test('Verification Workflow State Machine enforces roles and mandatory rejection note', () => {
  assert.equal(canTransitionVerification('draft', 'diajukan', 'operator').allowed, true);
  assert.equal(canTransitionVerification('ditolak', 'diajukan', 'operator').allowed, true);
  assert.equal(canTransitionVerification('draft', 'disetujui', 'operator').allowed, false);
  assert.equal(canTransitionVerification('diajukan', 'disetujui', 'operator').allowed, false);

  assert.equal(canTransitionVerification('diajukan', 'diverifikasi', 'super_admin').allowed, true);
  assert.equal(canTransitionVerification('diverifikasi', 'disetujui', 'super_admin').allowed, true);
  assert.equal(canTransitionVerification('diajukan', 'ditolak', 'super_admin', true, '').allowed, false);
  assert.equal(
    canTransitionVerification('diajukan', 'ditolak', 'super_admin', true, 'Scan SK IJOP buram').allowed,
    true,
  );
  assert.equal(canTransitionVerification('disetujui', 'draft', 'super_admin', false).allowed, false);
  assert.equal(canTransitionVerification('disetujui', 'draft', 'super_admin', true).allowed, true);
});

test('IJOP Expiry status categorizes aktif, <=90 days warning, and kedaluwarsa', () => {
  const refDate = new Date('2026-09-24T00:00:00');
  assert.equal(computeIjopStatus('', refDate), 'belum_ada');
  assert.equal(computeIjopStatus('2026-09-20', refDate), 'kedaluwarsa');
  assert.equal(computeIjopStatus('2026-11-15', refDate), 'segera_berakhir');
  assert.equal(computeIjopStatus('2028-05-01', refDate), 'aktif');
});

test('Security sanitization blocks javascript/data URLs and Excel formula injection', () => {
  assert.equal(isSafeHttpsUrl(''), true);
  assert.equal(isSafeHttpsUrl('https://kemenag.go.id/ijop/123.pdf'), true);
  assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpsUrl('http://insecure.local/file.pdf'), false);
  assert.equal(isSafeHttpsUrl('data:text/html,<script>alert(1)</script>'), false);

  assert.equal(sanitizeSpreadsheetCell('=CMD|calc'), "'=CMD|calc");
  assert.equal(sanitizeSpreadsheetCell('+1+1'), "'+1+1");
  assert.equal(sanitizeSpreadsheetCell('Pondok Al-Falah'), 'Pondok Al-Falah');
  assert.match(makeSafeDocId('op', 'user+test@gmail.com'), /^[a-zA-Z0-9_-]{1,128}$/);
});

test('Completeness calculation tracks missing sections cleanly', () => {
  const res = calculateCompleteness(
    { nama: 'Al-Hikmah', alamat: 'Jl. Raya 1', kecamatan: 'Kec. Kota', desa: 'Desa Baru', namaPimpinan: 'KH. Ahmad' },
    null,
    null,
  );
  assert.equal(res.percent, 20);
  assert.equal(res.missingSections.length, 4);
});
