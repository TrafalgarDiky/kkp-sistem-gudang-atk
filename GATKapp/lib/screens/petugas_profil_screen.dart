import 'package:flutter/material.dart';

import '../services/auth_profile_api.dart';

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
                Center(child: CircularProgressIndicator()),
              ],
            );
          }
          if (snap.hasError) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                Text('${snap.error}', style: TextStyle(color: Theme.of(context).colorScheme.error)),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => setState(() => _future = AuthProfileApi.fetchMe()),
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
            padding: const EdgeInsets.all(20),
            children: [
              Text('Akun kamu', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _row('Nama', nama),
                      _row('Email', email),
                      if (divisi != null && divisi.isNotEmpty) _row('Divisi', divisi),
                      _row('Role', role),
                      _row('Status akun', status),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Ubah nama/email/divisi dari aplikasi web jika admin mengizinkan alur tersebut.',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
