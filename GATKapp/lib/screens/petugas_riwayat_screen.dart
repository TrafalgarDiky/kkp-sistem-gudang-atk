import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/auth_user.dart';
import '../models/tugas_petugas.dart';
import '../services/tugas_api.dart';

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
    final selesai = _tugas.where((t) {
      if (t.petugasId != uid) return false;
      return t.statusTugas == 'SELESAI' || t.statusTugas == 'DELIVERED';
    }).toList()
      ..sort((a, b) {
        final da = a.updatedAt ?? a.createdAt;
        final db = b.updatedAt ?? b.createdAt;
        return (db ?? DateTime(1970)).compareTo(da ?? DateTime(1970));
      });

    return RefreshIndicator(
      onRefresh: _load,
      child: _loading
          ? ListView(
              children: const [
                SizedBox(height: 120),
                Center(child: CircularProgressIndicator()),
              ],
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Tugas yang sudah kamu selesaikan.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                      ),
                ),
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _error!,
                      style: TextStyle(color: Theme.of(context).colorScheme.error),
                    ),
                  ),
                if (!_loading && selesai.isEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 48),
                    child: Center(
                      child: Column(
                        children: [
                          Icon(Icons.history,
                              size: 48, color: Theme.of(context).colorScheme.outline),
                          const SizedBox(height: 8),
                          const Text('Belum ada riwayat selesai'),
                        ],
                      ),
                    ),
                  )
                else
                  ...selesai.map(
                    (t) => Card(
                      margin: const EdgeInsets.only(top: 12),
                      child: ListTile(
                        title: Text(t.permintaan?.kode ?? t.id),
                        subtitle: Text(
                          '${pemintaNama(t)}\n${_fmtDt(t.updatedAt ?? t.createdAt)}'
                          '${t.lokasiTujuan != null && t.lokasiTujuan!.isNotEmpty ? '\n📍 ${t.lokasiTujuan}' : ''}',
                        ),
                        isThreeLine: true,
                      ),
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
