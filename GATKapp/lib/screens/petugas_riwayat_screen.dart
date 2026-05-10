import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../models/auth_user.dart';
import '../models/tugas_petugas.dart';
import '../services/tugas_api.dart';
import '../theme/gatk_brand.dart';

/// Riwayat tugas selesai milik petugas — data dari GET /api/permintaan/tugas (filter klien).
class PetugasRiwayatScreen extends StatefulWidget {
  const PetugasRiwayatScreen({super.key, required this.user});

  final AuthUser user;

  @override
  State<PetugasRiwayatScreen> createState() => _PetugasRiwayatScreenState();
}

class _PetugasRiwayatScreenState extends State<PetugasRiwayatScreen> {
  List<TugasPetugas> _tugas = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await TugasApi.fetchTugas();
      if (!mounted) return;
      setState(() => _tugas = list);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _fmtDt(DateTime? d) {
    if (d == null) return '—';
    return DateFormat("d MMM yyyy, HH:mm", 'id_ID').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final uid = widget.user.id;
    final selesai =
        _tugas.where((t) {
          if (t.petugasId != uid) return false;
          return t.statusTugas == 'SELESAI' || t.statusTugas == 'DELIVERED';
        }).toList()..sort((a, b) {
          final da = a.updatedAt ?? a.createdAt;
          final db = b.updatedAt ?? b.createdAt;
          return (db ?? DateTime(1970)).compareTo(da ?? DateTime(1970));
        });

    return RefreshIndicator(
      color: GatkBrand.logoSky,
      onRefresh: _load,
      child: _loading
          ? ListView(
              children: const [
                SizedBox(height: 120),
                Center(
                  child: CircularProgressIndicator(color: GatkBrand.logoSky),
                ),
              ],
            )
          : ListView(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
              children: [
                _HistoryHeader(total: selesai.length),
                const SizedBox(height: 16),
                Text(
                  'Daftar selesai',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: GatkBrand.textOnDark,
                    letterSpacing: -0.3,
                  ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _error!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                if (!_loading && selesai.isEmpty)
                  const _EmptyHistory()
                else
                  ...selesai.map(
                    (t) => _HistoryTile(
                      kode: t.permintaan?.kode ?? t.id,
                      peminta: pemintaNama(t),
                      waktu: _fmtDt(t.updatedAt ?? t.createdAt),
                      lokasi: t.lokasiTujuan,
                    ),
                  ),
              ],
            ),
    );
  }

  String pemintaNama(TugasPetugas t) {
    return t.permintaan?.peminta?.nama ?? '—';
  }
}

class _HistoryHeader extends StatelessWidget {
  const _HistoryHeader({required this.total});

  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFF22C55E).withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.history_rounded,
              color: Color(0xFF22C55E),
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Riwayat pengantaran',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: GatkBrand.textOnDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$total tugas sudah selesai kamu antar.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: GatkBrand.textOnDarkMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyHistory extends StatelessWidget {
  const _EmptyHistory();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: GatkBrand.surfaceDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: GatkBrand.borderDark.withValues(alpha: 0.65)),
      ),
      child: Column(
        children: [
          Icon(
            Icons.history_rounded,
            size: 42,
            color: GatkBrand.textOnDarkMuted,
          ),
          const SizedBox(height: 10),
          Text(
            'Belum ada riwayat selesai',
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w700,
              color: GatkBrand.textOnDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Tugas yang sudah kamu tandai selesai akan muncul di sini.',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              color: GatkBrand.textOnDarkMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({
    required this.kode,
    required this.peminta,
    required this.waktu,
    required this.lokasi,
  });

  final String kode;
  final String peminta;
  final String waktu;
  final String? lokasi;

  @override
  Widget build(BuildContext context) {
    final loc = lokasi?.trim();
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: GatkBrand.surfaceDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: GatkBrand.borderDark.withValues(alpha: 0.65)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF22C55E).withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(
              Icons.check_circle_outline_rounded,
              color: Color(0xFF22C55E),
              size: 23,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        kode,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: GatkBrand.textOnDark,
                          letterSpacing: -0.2,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF22C55E).withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(
                        'Selesai',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF86EFAC),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  peminta,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: GatkBrand.textOnDark,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  waktu,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: GatkBrand.textOnDarkMuted,
                  ),
                ),
                if (loc != null && loc.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        Icons.place_outlined,
                        size: 15,
                        color: GatkBrand.textOnDarkMuted,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          loc,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            color: GatkBrand.textOnDarkMuted,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
