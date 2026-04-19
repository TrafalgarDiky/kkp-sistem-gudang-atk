import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/auth_user.dart';
import '../models/tugas_petugas.dart';
import '../services/tugas_api.dart';
import '../theme/gatk_brand.dart';

/// Beranda petugas — profil, statistik, CTA, tugas terbaru (tema gelap navy + sky).
class PetugasDashboardScreen extends StatefulWidget {
  const PetugasDashboardScreen({
    super.key,
    required this.user,
    required this.onBukaDaftarTugas,
    required this.onDrillDown,
    required this.onBukaRiwayat,
  });

  final AuthUser user;
  final VoidCallback onBukaDaftarTugas;
  final void Function(String kepemilikan) onDrillDown;
  final VoidCallback onBukaRiwayat;

  @override
  State<PetugasDashboardScreen> createState() => _PetugasDashboardScreenState();
}

class _PetugasDashboardScreenState extends State<PetugasDashboardScreen> {
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

  String _greeting() {
    final h = DateTime.now().hour;
    if (h >= 5 && h <= 10) return 'Selamat pagi';
    if (h >= 11 && h <= 14) return 'Selamat siang';
    if (h >= 15 && h <= 17) return 'Selamat sore';
    return 'Selamat malam';
  }

  String _initials(String? nama) {
    if (nama == null || nama.trim().isEmpty) return '?';
    final parts = nama.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) {
      return parts[0].length >= 2
          ? parts[0].substring(0, 2).toUpperCase()
          : parts[0].toUpperCase();
    }
    return ('${parts.first[0]}${parts.last[0]}').toUpperCase();
  }

  /// Label peran singkat untuk kartu profil.
  String _roleLabel() {
    final r = widget.user.role.toUpperCase();
    if (r.contains('PETUGAS') || r.contains('GUDANG')) {
      return 'Petugas Gudang';
    }
    if (widget.user.role.trim().isEmpty) return 'Petugas';
    return widget.user.role;
  }

  List<TugasPetugas> _recentTugas() {
    final list = _tugas.where((t) => !t.ditolakAdmin).toList();
    list.sort((a, b) {
      final da = a.updatedAt ?? a.createdAt;
      final db = b.updatedAt ?? b.createdAt;
      return (db ?? DateTime.fromMillisecondsSinceEpoch(0))
          .compareTo(da ?? DateTime.fromMillisecondsSinceEpoch(0));
    });
    return list.take(5).toList();
  }

  @override
  Widget build(BuildContext context) {
    final stats = PetugasDashboardStats.compute(_tugas, widget.user.id);
    final recent = _recentTugas();

    return RefreshIndicator(
      color: GatkBrand.logoSky,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
        children: [
          _ProfileCard(
            greeting: _greeting(),
            displayName: widget.user.nama.trim().isNotEmpty
                ? widget.user.nama
                : _roleLabel(),
            roleLabel: _roleLabel(),
            initials: _initials(widget.user.nama),
            aktif: _isPetugasAktif(),
          ),
          const SizedBox(height: 18),
          if (_loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 20),
              child: Center(
                child: CircularProgressIndicator(
                  color: GatkBrand.logoSky,
                  strokeWidth: 2.5,
                ),
              ),
            )
          else
            _StatCardsRow(
              tersedia: stats.tersedia,
              sayaAktif: stats.sayaAktif,
              selesaiHariIni: stats.selesaiHariIni,
              onTersedia: () => widget.onDrillDown('TERSEDIA'),
              onSaya: () => widget.onDrillDown('SAYA'),
              onSelesai: widget.onBukaRiwayat,
            ),
          const SizedBox(height: 20),
          _PrimaryCta(onPressed: widget.onBukaDaftarTugas),
          if (_error != null) ...[
            const SizedBox(height: 14),
            Text(
              _error!,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                color: Theme.of(context).colorScheme.error,
              ),
            ),
          ],
          const SizedBox(height: 28),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Tugas terbaru',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: GatkBrand.textOnDark,
                    letterSpacing: -0.3,
                  ),
                ),
              ),
              TextButton(
                onPressed: widget.onBukaDaftarTugas,
                child: Text(
                  'Lihat semua',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: GatkBrand.logoSky,
                  ),
                ),
              ),
            ],
          ),
          if (_loading) ...[
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                minHeight: 3,
                color: GatkBrand.logoSky,
                backgroundColor: const Color(0xFF334155),
              ),
            ),
          ],
          const SizedBox(height: 12),
          if (!_loading && recent.isEmpty)
            _EmptyRecent()
          else if (!_loading)
            ...recent.map(
              (t) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _RecentTaskTile(
                  tugas: t,
                  onTap: () {
                    final ui = _taskStatusUi(t);
                    if (ui.label == 'Antrian') {
                      widget.onDrillDown('TERSEDIA');
                    } else if (ui.label == 'Selesai') {
                      widget.onBukaRiwayat();
                    } else {
                      widget.onDrillDown('SAYA');
                    }
                  },
                ),
              ),
            ),
        ],
      ),
    );
  }

  bool _isPetugasAktif() {
    final s = widget.user.statusAkun.toUpperCase();
    return s == 'AKTIF' || s == 'ACTIVE' || s.isEmpty;
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({
    required this.greeting,
    required this.displayName,
    required this.roleLabel,
    required this.initials,
    required this.aktif,
  });

  final String greeting;
  final String displayName;
  final String roleLabel;
  final String initials;
  final bool aktif;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: GatkBrand.surfaceDark,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: GatkBrand.borderDark.withValues(alpha: 0.65),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: GatkBrand.logoSky.withValues(alpha: 0.22),
              border: Border.all(
                color: GatkBrand.logoSky.withValues(alpha: 0.35),
              ),
            ),
            alignment: Alignment.center,
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
                  '$greeting,',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: GatkBrand.textOnDarkMuted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  displayName,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: GatkBrand.textOnDark,
                    letterSpacing: -0.3,
                  ),
                ),
                if (roleLabel.isNotEmpty && roleLabel != displayName) ...[
                  const SizedBox(height: 4),
                  Text(
                    roleLabel,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: GatkBrand.textOnDarkMuted,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                if (aktif)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF14532D).withValues(alpha: 0.45),
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: const Color(0xFF22C55E).withValues(alpha: 0.45),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF22C55E),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Petugas Aktif',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: const Color(0xFF86EFAC),
                          ),
                        ),
                      ],
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

/// Tiga kartu statistik sejajar (Antrian / Tugas saya / Selesai hari ini).
class _StatCardsRow extends StatelessWidget {
  const _StatCardsRow({
    required this.tersedia,
    required this.sayaAktif,
    required this.selesaiHariIni,
    required this.onTersedia,
    required this.onSaya,
    required this.onSelesai,
  });

  final int tersedia;
  final int sayaAktif;
  final int selesaiHariIni;
  final VoidCallback onTersedia;
  final VoidCallback onSaya;
  final VoidCallback onSelesai;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCell(
            value: tersedia,
            label: 'Antrian',
            valueColor: const Color(0xFFF59E0B),
            onTap: onTersedia,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCell(
            value: sayaAktif,
            label: 'Tugas saya',
            valueColor: GatkBrand.logoSky,
            onTap: onSaya,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCell(
            value: selesaiHariIni,
            label: 'Selesai hari ini',
            valueColor: const Color(0xFF22C55E),
            onTap: onSelesai,
          ),
        ),
      ],
    );
  }
}

class _StatCell extends StatelessWidget {
  const _StatCell({
    required this.value,
    required this.label,
    required this.valueColor,
    required this.onTap,
  });

  final int value;
  final String label;
  final Color valueColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: GatkBrand.surfaceDark,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: GatkBrand.borderDark.withValues(alpha: 0.7),
            ),
          ),
          child: Column(
            children: [
              Text(
                '$value',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: valueColor,
                  height: 1,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  height: 1.25,
                  color: GatkBrand.textOnDarkMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PrimaryCta extends StatelessWidget {
  const _PrimaryCta({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(
              colors: [
                Color(0xFF0284C7),
                GatkBrand.logoSky,
              ],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            boxShadow: [
              BoxShadow(
                color: GatkBrand.logoSky.withValues(alpha: 0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.list_alt_rounded, color: Colors.white, size: 22),
                const SizedBox(width: 10),
                Text(
                  'Lihat daftar tugas',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _EmptyRecent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: GatkBrand.surfaceDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: GatkBrand.borderDark.withValues(alpha: 0.65),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.inventory_2_outlined,
            size: 40,
            color: GatkBrand.textOnDarkMuted,
          ),
          const SizedBox(height: 10),
          Text(
            'Belum ada tugas terbaru',
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w600,
              color: GatkBrand.textOnDark,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Tugas akan muncul di sini setelah ada permintaan.',
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

class _RecentTaskTile extends StatelessWidget {
  const _RecentTaskTile({required this.tugas, required this.onTap});

  final TugasPetugas tugas;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ui = _taskStatusUi(tugas);
    final title = _taskTitle(tugas);
    final idLine = _taskIdLine(tugas);
    final loc = tugas.lokasiTujuan?.trim().isNotEmpty == true
        ? tugas.lokasiTujuan!
        : 'Lokasi belum diisi';

    return Material(
      color: GatkBrand.surfaceDark,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: GatkBrand.borderDark.withValues(alpha: 0.65),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  color: ui.iconBg,
                ),
                child: Icon(ui.icon, color: ui.iconFg, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                idLine,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: GatkBrand.textOnDarkMuted,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                title,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: GatkBrand.textOnDark,
                                  height: 1.25,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: ui.badgeBg,
                            borderRadius: BorderRadius.circular(99),
                          ),
                          child: Text(
                            ui.label,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: ui.badgeFg,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
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
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              color: GatkBrand.textOnDarkMuted,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TaskStatusStyle {
  const _TaskStatusStyle({
    required this.label,
    required this.badgeBg,
    required this.badgeFg,
    required this.iconBg,
    required this.iconFg,
    required this.icon,
  });

  final String label;
  final Color badgeBg;
  final Color badgeFg;
  final Color iconBg;
  final Color iconFg;
  final IconData icon;
}

_TaskStatusStyle _taskStatusUi(TugasPetugas t) {
  if (t.ditolakAdmin) {
    return const _TaskStatusStyle(
      label: 'Ditolak',
      badgeBg: Color(0xFF7F1D1D),
      badgeFg: Color(0xFFFECACA),
      iconBg: Color(0xFF7F1D1D),
      iconFg: Color(0xFFF87171),
      icon: Icons.block_rounded,
    );
  }
  final waiting =
      t.statusTugas == 'MENUNGGU_ASSIGN' &&
      (t.petugasId == null || t.petugasId!.isEmpty);
  if (waiting) {
    return const _TaskStatusStyle(
      label: 'Antrian',
      badgeBg: Color(0xFF78350F),
      badgeFg: Color(0xFFFDE68A),
      iconBg: Color(0xFF78350F),
      iconFg: Color(0xFFFBBF24),
      icon: Icons.schedule_rounded,
    );
  }
  if (t.statusTugas == 'SELESAI' || t.statusTugas == 'DELIVERED') {
    return const _TaskStatusStyle(
      label: 'Selesai',
      badgeBg: Color(0xFF14532D),
      badgeFg: Color(0xFFBBF7D0),
      iconBg: Color(0xFF14532D),
      iconFg: Color(0xFF4ADE80),
      icon: Icons.check_circle_outline_rounded,
    );
  }
  return _TaskStatusStyle(
    label: 'Diproses',
    badgeBg: const Color(0xFF0C4A6E).withValues(alpha: 0.85),
    badgeFg: const Color(0xFFBAE6FD),
    iconBg: const Color(0xFF0C4A6E).withValues(alpha: 0.75),
    iconFg: GatkBrand.logoSky,
    icon: t.statusTugas == 'ON_DELIVERY'
        ? Icons.local_shipping_outlined
        : Icons.inventory_2_outlined,
  );
}

String _taskTitle(TugasPetugas t) {
  final items = t.permintaan?.items;
  if (items != null && items.isNotEmpty) {
    final n = items.first.barang?.nama;
    if (n != null && n.isNotEmpty) {
      return n;
    }
  }
  final k = t.permintaan?.kode;
  if (k != null && k.isNotEmpty) {
    return 'Permintaan $k';
  }
  return 'Pengiriman permintaan';
}

String _taskIdLine(TugasPetugas t) {
  final k = t.permintaan?.kode;
  if (k != null && k.isNotEmpty) {
    return '#$k';
  }
  final id = t.id;
  if (id.length > 10) {
    return '#${id.substring(0, 8)}…';
  }
  return '#$id';
}
