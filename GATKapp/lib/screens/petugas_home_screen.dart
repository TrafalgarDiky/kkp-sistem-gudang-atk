import 'package:flutter/material.dart';

import '../models/auth_user.dart';
import '../services/api_health.dart';
import '../services/auth_storage.dart';
import 'login_screen.dart';

/// Halaman awal setelah login (nanti bisa ditambah menu barang / permintaan).
class PetugasHomeScreen extends StatelessWidget {
  const PetugasHomeScreen({super.key, required this.user});

  final AuthUser user;

  Future<void> _logout(BuildContext context) async {
    await AuthStorage.clear();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  Future<void> _health(BuildContext context) async {
    try {
      final text = await checkApiHealth();
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(text), duration: const Duration(seconds: 5)),
      );
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Beranda petugas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Keluar',
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text('Halo, ${user.nama}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          Text('Email: ${user.email}'),
          Text('Role: ${user.role}'),
          if (user.divisi != null && user.divisi!.isNotEmpty)
            Text('Divisi: ${user.divisi}'),
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: () => _health(context),
            icon: const Icon(Icons.wifi_tethering),
            label: const Text('Cek /api/health'),
          ),
        ],
      ),
    );
  }
}
