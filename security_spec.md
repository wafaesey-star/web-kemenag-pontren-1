# Security Specification — Sistem Pendataan Pondok Pesantren

## 1. Data Invariants
1. **Default-Deny Net**: Any path not explicitly matched is denied (`read, write: if false`).
2. **Verified Identity**: All authenticated writes require `request.auth != null && request.auth.token.email_verified == true`.
3. **Kemenag Authority**: Only Super Admins (`isAdmin()`) may create/delete `pesantren`, manage `users` / `operator_invites` / `operator_assignments`, update `system_config`, publish `public_pesantren`, or transition `diajukan -> diverifikasi -> disetujui / ditolak`.
4. **Operator Scope Isolation**: Active operators may read/update ONLY `pesantren`, `legalitas`, and `data_periodik` where `isAssignedOperator(pesantrenId)` holds AND `isActiveOperator()` holds. Operators CANNOT create `pesantren`, read/write other pesantren, self-escalate roles, or approve their own submissions.
5. **PII & IJOP Isolation**: `public_pesantren` exposes non-sensitive directory/map fields ONLY for `statusKeaktifan == 'aktif'`; phone/email contacts, IJOP documents (`legalitas`, `legalitas_history`), and internal revision notes (`verifikasi_logs`, `audit_logs`) are strictly gated from public reads.
6. **Temporal & Append-Only Integrity**: `createdAt` / `updatedAt` MUST match `request.time`; `audit_logs`, `verifikasi_logs`, and `legalitas_history` forbid client updates and deletes.

## 2. "Dirty Dozen" Attack Payloads (Expected: `PERMISSION_DENIED`)
1. Unauthenticated read on `/pesantren/ps_01` or `/legalitas/ps_01`.
2. Unauthenticated write on `/public_pesantren/ps_01`.
3. Operator A (`uid_op_a`) reading `/pesantren/ps_b` assigned only to Operator B.
4. Operator A creating a new `/pesantren/ps_new` directly.
5. Operator A self-updating `/users/uid_op_a` to `{ role: "super_admin", isActive: true }`.
6. Operator A adding a shadow field `{ isAdmin: true }` to `/pesantren/ps_a` (Shadow Update).
7. Operator A transitioning `/pesantren/ps_a` directly from `draft` to `disetujui` (State Shortcutting).
8. Deactivated operator (`isActive: false`) updating `/data_periodik/ps_a__2026`.
9. Unverified email claim (`email_verified: false`, `email: "wafaesey@gmail.com"`) attempting admin read/write (Email Spoofing).
10. Operator modifying or deleting `/audit_logs/log_1` or `/verifikasi_logs/v_1`.
11. Resource poisoning: 10,000-character string in `nama` or document ID > 128 chars.
12. Cross-tenant query scraping: Operator calling `list` on `/pesantren` without `assignedOperatorUids array-contains request.auth.uid`.
