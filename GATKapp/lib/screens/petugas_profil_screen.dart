import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/auth_profile_api.dart';
import '../theme/gatk_brand.dart';

/// Profil singkat — selaras dengan halaman Profil web (baca dari GET /api/auth/me).
class PetugasProfilScreen extends StatefulWidget {
  const PetugasProfilScreen({super.key});

  @override
  State<PetugasProfilScreen> createState() => _PetugasProfilScreenState();
}

class _PetugasProfilScreenState extends State<PetugasProfilScreen> {
  Future<Map<String, dynamic>>? _future;

  @override
  void initState() {
    super.initState();
    _future = AuthProfileApi.fetchMe();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: GatkBrand.logoSky,
      onRefresh: () async {
        setState(() => _future = AuthProfileApi.fetchMe());
        await _future;
      },
      child: FutureBuilder<Map<String, dynamic>>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return ListView(
              children: const [
                SizedBox(height: 120),
                Center(
                  child: CircularProgressIndicator(color: GatkBrand.logoSky),
                ),
              ],
            );
          }
          if (snap.hasError) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Text(
                  '${snap.error}',
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () =>
                      setState(() => _future = AuthProfileApi.fetchMe()),
                  child: const Text('Coba lagi'),
                ),
              ],
            );
          }
          final u = snap.data!;
          final nama = u['nama']?.toString() ?? '—';
          final email = u['email']?.toString() ?? '—';
          final divisi = u['divisi']?.toString();
          final role = u['role']?.toString() ?? '—';
          final status = u['statusAkun']?.toString() ?? '—';

          return ListView(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
            children: [
              _ProfileHeader(
                nama: nama,
                email: email,
                role: role,
                status: status,
              ),
              const SizedBox(height: 16),
              _InfoCard(
                rows: [
                  _InfoRowData('Nama', nama, Icons.person_outline_rounded),
                  _InfoRowData('Email', email, Icons.mail_outline_rounded),
                  if (divisi != null && divisi.isNotEmpty)
                    _InfoRowData('Divisi', divisi, Icons.apartment_outlined),
                  _InfoRowData('Role', role, Icons.badge_outlined),
                  _InfoRowData(
                    'Status akun',
                    status,
                    Icons.verified_user_outlined,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _HintCard(
                text:
                    'Ubah nama, email, atau divisi dari aplikasi web jika admin mengizinkan alur tersebut.',
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.nama,
    required this.email,
    required this.role,
    required this.status,
  });

  final String nama;
  final String email;
  final String role;
  final String status;

  String get initials {
    final parts = nama
        .trim()
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .toList();
    if (parts.isEmpty || nama == '—') return 'PG';
    if (parts.length == 1) {
      return parts.first.length >= 2
          ? parts.first.substring(0, 2).toUpperCase()
          : parts.first.toUpperCase();
    }
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final aktif =
        status.toUpperCase() == 'AKTIF' || status.toUpperCase() == 'ACTIVE';
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: GatkBrand.surfaceDark,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: GatkBrand.borderDark.withValues(alpha: 0.65)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.18),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 58,
            height: 58,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: GatkBrand.logoSky.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: GatkBrand.logoSky.withValues(alpha: 0.55),
              ),
            ),
            child: Text(
              initials,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: GatkBrand.logoSky,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  nama,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: GatkBrand.textOnDark,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  email,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: GatkBrand.textOnDarkMuted,
                  ),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _SmallBadge(text: role, color: GatkBrand.logoSky),
                    _SmallBadge(
                      text: aktif ? 'Aktif' : status,
                      color: aktif
                          ? const Color(0xFF22C55E)
                          : const Color(0xFFF59E0B),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SmallBadge extends StatelessWidget {
  const _SmallBadge({required this.text, required this.color});

  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Text(
        text,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: color,
        ),
      ),
    );
  }
}

class _InfoRowData {
  const _InfoRowData(this.label, this.value, this.icon);

  final String label;
  final String value;
  final IconData icon;
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.rows});

  final List<_InfoRowData> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: GatkBrand.surfaceDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: GatkBrand.borderDark.withValues(alpha: 0.65)),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            _InfoRow(row: rows[i]),
            if (i != rows.length - 1)
              Divider(
                height: 20,
                color: GatkBrand.borderDark.withValues(alpha: 0.35),
              ),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.row});

  final _InfoRowData row;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(row.icon, size: 20, color: GatkBrand.logoSky),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                row.label,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: GatkBrand.textOnDarkMuted,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                row.value,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: GatkBrand.textOnDark,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HintCard extends StatelessWidget {
  const _HintCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: GatkBrand.logoSky.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: GatkBrand.logoSky.withValues(alpha: 0.18)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline_rounded,
            color: GatkBrand.logoSky,
            size: 19,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                height: 1.45,
                fontWeight: FontWeight.w500,
                color: GatkBrand.textOnDarkMuted,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
