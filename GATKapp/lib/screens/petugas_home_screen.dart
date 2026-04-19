import 'dart:async';

import 'package:flutter/material.dart';

import '../models/auth_user.dart';
import '../models/tugas_petugas.dart';
import '../services/auth_storage.dart';
import '../services/local_notification_service.dart';
import '../services/tugas_api.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'petugas_dashboard_screen.dart';
import 'petugas_profil_screen.dart';
import 'petugas_riwayat_screen.dart';
import 'petugas_tugas_list_screen.dart';

/// Shell petugas: Beranda / Daftar Tugas / Riwayat — selaras menu web.
/// Polling ringan mendeteksi ID tugas "tersedia" baru → notifikasi lokal.
class PetugasHomeScreen extends StatefulWidget {
  const PetugasHomeScreen({super.key, required this.user});

  final AuthUser user;

  @override
  State<PetugasHomeScreen> createState() => _PetugasHomeScreenState();
}

class _PetugasHomeScreenState extends State<PetugasHomeScreen> {
  int _index = 0;
  String? _tugasKepemilikan;

  Timer? _pollTimer;
  final Set<String> _lastAvailableIds = {};
  bool _pollSeeded = false;

  @override
  void initState() {
    super.initState();
    LocalNotificationService.instance.init();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 25),
      (_) => _pollTugasBaru(),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _pollTugasBaru());
  }

  /// Deteksi tugas baru di antrian (MENUNGGU + belum punya petugas), bandingkan snapshot.
  Future<void> _pollTugasBaru() async {
    try {
      final list = await TugasApi.fetchTugas();
      final available = list
          .where((TugasPetugas t) {
            if (t.ditolakAdmin) return false;
            return t.statusTugas == 'MENUNGGU_ASSIGN' &&
                (t.petugasId == null || t.petugasId!.isEmpty);
          })
          .map((t) => t.id)
          .toSet();

      if (!_pollSeeded) {
        _lastAvailableIds
          ..clear()
          ..addAll(available);
        _pollSeeded = true;
        return;
      }

      final baru = available.difference(_lastAvailableIds);
      _lastAvailableIds
        ..clear()
        ..addAll(available);

      for (final _ in baru) {
        await LocalNotificationService.instance.showTugasBaru();
      }
    } catch (_) {
      /* jangan ganggu UI */
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  Future<void> _logout() async {
    await AuthStorage.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: buildPetugasShellTheme(),
      child: Scaffold(
        appBar: AppBar(
          title: Text(_titles[_index]),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout_rounded),
              tooltip: 'Keluar',
              onPressed: _logout,
            ),
          ],
        ),
        body: IndexedStack(
          index: _index,
          children: [
            PetugasDashboardScreen(
              user: widget.user,
              onBukaDaftarTugas: () => setState(() {
                _tugasKepemilikan = null;
                _index = 1;
              }),
              onDrillDown: (kepemilikan) => setState(() {
                _tugasKepemilikan = kepemilikan;
                _index = 1;
              }),
              onBukaRiwayat: () => setState(() => _index = 2),
            ),
            PetugasTugasListScreen(
              key: ValueKey<String?>(_tugasKepemilikan),
              user: widget.user,
              initialKepemilikan: _tugasKepemilikan,
            ),
            PetugasRiwayatScreen(user: widget.user),
            const PetugasProfilScreen(),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _index,
          onDestinationSelected: (i) => setState(() => _index = i),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: 'Beranda',
            ),
            NavigationDestination(
              icon: Icon(Icons.list_alt_outlined),
              selectedIcon: Icon(Icons.list_alt_rounded),
              label: 'Tugas',
            ),
            NavigationDestination(
              icon: Icon(Icons.history_outlined),
              selectedIcon: Icon(Icons.history),
              label: 'Riwayat',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person),
              label: 'Profil',
            ),
          ],
        ),
      ),
    );
  }

  static const _titles = [
    'Beranda',
    'Tugas',
    'Riwayat',
    'Profil',
  ];
}
