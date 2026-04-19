import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/auth_user.dart';
import '../models/tugas_petugas.dart';
import '../services/permintaan_api.dart';
import '../services/tugas_api.dart';

/// Daftar tugas aktif — filter & aksi selaras dengan `PetugasTugas.js`.
class PetugasTugasListScreen extends StatefulWidget {
  const PetugasTugasListScreen({
    super.key,
    required this.user,
    this.initialKepemilikan,
  });

  final AuthUser user;
  final String? initialKepemilikan;

  @override
  State<PetugasTugasListScreen> createState() => _PetugasTugasListScreenState();
}

class _PetugasTugasListScreenState extends State<PetugasTugasListScreen> {
  List<TugasPetugas> _tugas = [];
  bool _loading = true;
  String? _error;
  /// ALL | SAYA | TERSEDIA — lebih mudah untuk `SegmentedButton`.
  String _ownSeg = 'ALL';
  /// ALL | MENUNGGU | DIANTAR
  String _statusSeg = 'ALL';

  @override
  void initState() {
    super.initState();
    _applyInitialKepemilikan();
    _load();
  }

  void _applyInitialKepemilikan() {
    final k = widget.initialKepemilikan?.toUpperCase();
    if (k == 'SAYA') {
      _ownSeg = 'SAYA';
    } else if (k == 'TERSEDIA') {
      _ownSeg = 'TERSEDIA';
    } else {
      _ownSeg = 'ALL';
    }
  }

  @override
  void didUpdateWidget(covariant PetugasTugasListScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialKepemilikan != oldWidget.initialKepemilikan) {
      setState(_applyInitialKepemilikan);
    }
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

  _StatusInfo _statusInfo(TugasPetugas t) {
    if (t.ditolakAdmin) {
      return const _StatusInfo('Ditolak', Colors.red);
    }
    switch (t.statusTugas) {
      case 'MENUNGGU_ASSIGN':
        return const _StatusInfo('Menunggu', Color(0xFFF59E0B));
      case 'DALAM_PROSES':
      case 'ON_DELIVERY':
        return const _StatusInfo('Diantar', Color(0xFF3B82F6));
      case 'SELESAI':
      case 'DELIVERED':
        return const _StatusInfo('Selesai', Color(0xFF22C55E));
      case 'DITOLAK':
        return const _StatusInfo('Ditolak', Colors.red);
      default:
        return _StatusInfo(t.statusTugas, Colors.grey);
    }
  }

  String rowStatusKey(TugasPetugas t) {
    if (t.ditolakAdmin) return 'DITOLAK';
    final s = t.statusTugas;
    if (s == 'MENUNGGU_ASSIGN') return 'MENUNGGU';
    if (s == 'DALAM_PROSES' || s == 'ON_DELIVERY') return 'DIANTAR';
    if (s == 'SELESAI' || s == 'DELIVERED') return 'SELESAI';
    return 'OTHER';
  }

  List<TugasPetugas> get _tugasAktif {
    return _tugas.where((t) {
      if (t.ditolakAdmin) return false;
      if (t.statusTugas == 'DITOLAK') return false;
      if (t.statusTugas == 'SELESAI' || t.statusTugas == 'DELIVERED') {
        return false;
      }
      return true;
    }).toList();
  }

  List<TugasPetugas> get _filtered {
    final uid = widget.user.id;
    var list = List<TugasPetugas>.from(_tugasAktif);

    if (_ownSeg == 'SAYA') {
      list = list.where((t) => t.petugasId == uid).toList();
    } else if (_ownSeg == 'TERSEDIA') {
      list = list
          .where(
            (t) =>
                t.statusTugas == 'MENUNGGU_ASSIGN' &&
                (t.petugasId == null || t.petugasId!.isEmpty),
          )
          .toList();
    }

    if (_statusSeg != 'ALL') {
      list = list.where((t) => rowStatusKey(t) == _statusSeg).toList();
    }

    list.sort((a, b) {
      final da = a.permintaan?.createdAt ?? a.createdAt;
      final db = b.permintaan?.createdAt ?? b.createdAt;
      return (db ?? DateTime(1970)).compareTo(da ?? DateTime(1970));
    });
    return list;
  }

  Future<void> _ambil(String id) async {
    try {
      await TugasApi.ambilTugas(id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tugas berhasil diambil')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _selesaiDialog(String tugasId) async {
    final ctrl = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Selesai — lokasi tujuan'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(
            labelText: 'Lokasi tujuan',
            hintText: 'Contoh: Ruang TU Lt.2',
          ),
          textCapitalization: TextCapitalization.sentences,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Simpan')),
        ],
      ),
    );
    final lok = ctrl.text.trim();
    ctrl.dispose();
    if (ok != true || !mounted) return;
    if (lok.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lokasi wajib diisi')),
      );
      return;
    }
    try {
      await TugasApi.selesaiTugas(tugasId: tugasId, lokasiTujuan: lok);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tugas selesai. Terima kasih!')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  bool _canLepas(TugasPetugas t, String uid) {
    if (t.ditolakAdmin) return false;
    if (t.petugasId != uid) return false;
    return const {'MENUNGGU_ASSIGN', 'DALAM_PROSES', 'ON_DELIVERY'}
        .contains(t.statusTugas);
  }

  Future<void> _lepasTugas(String tugasId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Lepas tugas?'),
        content: const Text(
          'Tugas akan kembali ke antrian agar petugas lain bisa mengambilnya.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(ctx).colorScheme.error,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Ya, lepas'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await TugasApi.lepasTugas(tugasId);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tugas dilepas, kembali ke antrian')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  Future<void> _openDetail(TugasPetugas t) async {
    final uid = widget.user.id;
    final canLepas = _canLepas(t, uid);
    final canAmbil = (t.petugasId == null || t.petugasId!.isEmpty) &&
        t.statusTugas == 'MENUNGGU_ASSIGN' &&
        !t.ditolakAdmin;
    final canSelesai = t.petugasId == uid &&
        const {
          'MENUNGGU_ASSIGN',
          'DALAM_PROSES',
          'ON_DELIVERY',
        }.contains(t.statusTugas);

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      useSafeArea: true,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: SizedBox(
            height: MediaQuery.of(ctx).size.height * 0.72,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                  child: Text(
                    t.permintaan?.kode ?? 'Detail tugas',
                    style: Theme.of(ctx).textTheme.titleLarge,
                  ),
                ),
                Expanded(
                  child: FutureBuilder<Map<String, dynamic>>(
                    future: PermintaanApi.fetchById(t.permintaanId),
                    builder: (context, snap) {
                      if (snap.connectionState == ConnectionState.waiting) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      if (snap.hasError) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Text(
                              '${snap.error}',
                              textAlign: TextAlign.center,
                            ),
                          ),
                        );
                      }
                      final p = snap.data!;
                      final catatan = p['catatanAdmin']?.toString();
                      final items = p['items'];
                      final list = items is List ? items : const [];

                      return ListView(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        children: [
                          if (t.permintaan?.peminta != null) ...[
                            Text(
                              t.permintaan!.peminta!.nama ?? '—',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            if (t.permintaan!.peminta!.divisi != null &&
                                t.permintaan!.peminta!.divisi!.isNotEmpty)
                              Text(
                                t.permintaan!.peminta!.divisi!,
                                style: Theme.of(ctx).textTheme.bodySmall,
                              ),
                            const SizedBox(height: 12),
                          ],
                          Text(
                            'Item permintaan',
                            style: Theme.of(ctx).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 8),
                          if (list.isEmpty)
                            Text(
                              'Tidak ada item.',
                              style: Theme.of(ctx).textTheme.bodySmall,
                            )
                          else
                            ...list.map((raw) {
                              if (raw is! Map<String, dynamic>) {
                                return const SizedBox.shrink();
                              }
                              final jumlah = raw['jumlah'];
                              final barang = raw['barang'];
                              String nama = '—';
                              String satuan = '';
                              if (barang is Map<String, dynamic>) {
                                nama = barang['nama']?.toString() ?? '—';
                                satuan = barang['satuan']?.toString() ?? '';
                              }
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(nama),
                                trailing: Text(
                                  '$jumlah $satuan'.trim(),
                                  style: Theme.of(ctx).textTheme.bodyMedium,
                                ),
                              );
                            }),
                          if (catatan != null && catatan.isNotEmpty) ...[
                            const SizedBox(height: 16),
                            Text(
                              'Catatan admin',
                              style: Theme.of(ctx).textTheme.titleSmall,
                            ),
                            const SizedBox(height: 4),
                            Text(catatan),
                          ],
                        ],
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Wrap(
                    alignment: WrapAlignment.end,
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Tutup'),
                      ),
                      if (canLepas)
                        FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: Theme.of(ctx).colorScheme.error,
                          ),
                          onPressed: () {
                            Navigator.pop(ctx);
                            _lepasTugas(t.id);
                          },
                          child: const Text('Lepas tugas'),
                        ),
                      if (canSelesai)
                        FilledButton.tonal(
                          onPressed: () {
                            Navigator.pop(ctx);
                            _selesaiDialog(t.id);
                          },
                          child: const Text('Selesai'),
                        ),
                      if (canAmbil)
                        FilledButton(
                          onPressed: () async {
                            Navigator.pop(ctx);
                            await _ambil(t.id);
                          },
                          child: const Text('Ambil tugas'),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _fmtDate(DateTime? d) {
    if (d == null) return '—';
    return DateFormat('d MMM yyyy', 'id_ID').format(d);
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final uid = widget.user.id;
    final aktif = _tugasAktif;
    int tersedia = 0;
    int saya = 0;
    for (final t in aktif) {
      if (t.statusTugas == 'MENUNGGU_ASSIGN' &&
          (t.petugasId == null || t.petugasId!.isEmpty)) {
        tersedia++;
      }
      if (t.petugasId == uid) saya++;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 6),
          child: Text(
            'Ambil dari antrian, antar, lalu tandai selesai.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: scheme.onSurfaceVariant,
                ),
          ),
        ),
        if (!_loading && aktif.isNotEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Text(
              'Antrian $tersedia · Milik saya $saya · Aktif ${aktif.length}',
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: scheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 4),
          child: SegmentedButton<String>(
            segments: const [
              ButtonSegment(
                value: 'ALL',
                label: Text('Semua'),
                icon: Icon(Icons.grid_view_rounded, size: 18),
              ),
              ButtonSegment(
                value: 'TERSEDIA',
                label: Text('Antrian'),
                icon: Icon(Icons.hourglass_top_rounded, size: 18),
              ),
              ButtonSegment(
                value: 'SAYA',
                label: Text('Saya'),
                icon: Icon(Icons.person_rounded, size: 18),
              ),
            ],
            selected: {_ownSeg},
            onSelectionChanged: (s) => setState(() => _ownSeg = s.first),
            multiSelectionEnabled: false,
            emptySelectionAllowed: false,
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
          child: SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'ALL', label: Text('Semua')),
              ButtonSegment(value: 'MENUNGGU', label: Text('Menunggu')),
              ButtonSegment(value: 'DIANTAR', label: Text('Diantar')),
            ],
            selected: {_statusSeg},
            onSelectionChanged: (s) => setState(() => _statusSeg = s.first),
            multiSelectionEnabled: false,
            emptySelectionAllowed: false,
          ),
        ),
        if (_error != null)
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : aktif.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.local_shipping_outlined,
                                size: 56, color: Theme.of(context).colorScheme.outline),
                            const SizedBox(height: 12),
                            const Text('Tidak ada tugas aktif',
                                style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            Text(
                              'Semua tugas sudah selesai. Lihat Riwayat untuk pengantaran lalu.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    )
                  : _filtered.isEmpty
                      ? const Center(child: Text('Tidak ada hasil — ubah filter.'))
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.builder(
                            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                            itemCount: _filtered.length,
                            itemBuilder: (context, i) {
                              final t = _filtered[i];
                              final info = _statusInfo(t);
                              final peminta = t.permintaan?.peminta;
                              final items = t.permintaan?.items ?? [];
                              final kode = t.permintaan?.kode ?? '—';
                              final isTakenByMe = t.petugasId == uid;
                              final canAmbil = (t.petugasId == null || t.petugasId!.isEmpty) &&
                                  t.statusTugas == 'MENUNGGU_ASSIGN';
                              final canSelesai = isTakenByMe &&
                                  const {
                                    'MENUNGGU_ASSIGN',
                                    'DALAM_PROSES',
                                    'ON_DELIVERY',
                                  }.contains(t.statusTugas);
                              final canLepasKartu = _canLepas(t, uid);

                              return Card(
                                margin: const EdgeInsets.only(bottom: 14),
                                child: InkWell(
                                  onTap: () => _openDetail(t),
                                  borderRadius: BorderRadius.circular(20),
                                  child: Padding(
                                    padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
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
                                                    kode,
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .titleMedium
                                                        ?.copyWith(
                                                          fontFamily: 'monospace',
                                                          fontWeight: FontWeight.w700,
                                                          letterSpacing: -0.3,
                                                        ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    _fmtDate(
                                                      t.permintaan?.createdAt ?? t.createdAt,
                                                    ),
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .labelSmall
                                                        ?.copyWith(
                                                          color: scheme.onSurfaceVariant,
                                                        ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(
                                                horizontal: 10,
                                                vertical: 5,
                                              ),
                                              decoration: BoxDecoration(
                                                color: info.color.withValues(alpha: 0.14),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Text(
                                                info.label,
                                                style: TextStyle(
                                                  color: info.color,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                            ),
                                            IconButton(
                                              icon: Icon(
                                                Icons.info_outline_rounded,
                                                color: scheme.primary,
                                              ),
                                              tooltip: 'Detail',
                                              onPressed: () => _openDetail(t),
                                            ),
                                          ],
                                        ),
                                        if (peminta != null) ...[
                                          const SizedBox(height: 10),
                                          Text(
                                            peminta.nama ?? '—',
                                            style: Theme.of(context)
                                                .textTheme
                                                .bodyLarge
                                                ?.copyWith(fontWeight: FontWeight.w600),
                                          ),
                                          if (peminta.divisi != null &&
                                              peminta.divisi!.isNotEmpty)
                                            Text(
                                              peminta.divisi!,
                                              style: Theme.of(context)
                                                  .textTheme
                                                  .bodySmall
                                                  ?.copyWith(color: scheme.onSurfaceVariant),
                                            ),
                                        ],
                                        if (items.isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          Text(
                                            items.length == 1
                                                ? '${items.first.barang?.nama ?? "-"} · ${items.first.jumlah} ${items.first.barang?.satuan ?? ""}'
                                                : '${items.length} jenis barang',
                                            style: Theme.of(context).textTheme.bodyMedium,
                                          ),
                                        ],
                                        const SizedBox(height: 12),
                                        Wrap(
                                          spacing: 8,
                                          runSpacing: 8,
                                          children: [
                                            if (canAmbil)
                                              FilledButton(
                                                onPressed: () => _ambil(t.id),
                                                child: const Text('Ambil tugas'),
                                              ),
                                            if (canSelesai)
                                              FilledButton.tonal(
                                                onPressed: () => _selesaiDialog(t.id),
                                                child: const Text('Selesai'),
                                              ),
                                            if (canLepasKartu)
                                              OutlinedButton(
                                                onPressed: () => _lepasTugas(t.id),
                                                child: const Text('Lepas'),
                                              ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }
}

class _StatusInfo {
  const _StatusInfo(this.label, this.color);
  final String label;
  final Color color;
}
