import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/tugas_petugas.dart';
import 'api_client.dart';

/// GET /api/permintaan/tugas dan aksi PATCH untuk petugas.
class TugasApi {
  TugasApi._();

  static Future<List<TugasPetugas>> fetchTugas() async {
    final res = await http
        .get(
          ApiConfig.uri('/api/permintaan/tugas'),
          headers: await authHeaders(),
        )
        .timeout(const Duration(seconds: 25));

    final decoded = jsonDecode(res.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Respons tidak valid.');
    }
    if (decoded['success'] != true) {
      throw Exception(decoded['message']?.toString() ?? 'Gagal memuat tugas');
    }
    final data = decoded['data'];
    final rawList = data is Map ? data['tugas'] : null;
    if (rawList is! List) return [];
    return rawList
        .whereType<Map<String, dynamic>>()
        .map(TugasPetugas.fromJson)
        .toList();
  }

  static Future<void> ambilTugas(String tugasId) async {
    final res = await http
        .patch(
          ApiConfig.uri('/api/permintaan/tugas/$tugasId/ambil'),
          headers: await authHeaders(),
        )
        .timeout(const Duration(seconds: 25));
    _ensureOk(res);
  }

  static Future<void> lepasTugas(String tugasId) async {
    final res = await http
        .patch(
          ApiConfig.uri('/api/permintaan/tugas/$tugasId/lepas'),
          headers: await authHeaders(),
        )
        .timeout(const Duration(seconds: 25));
    _ensureOk(res);
  }

  /// Tandai selesai + lokasi tujuan (sama dengan web).
  static Future<void> selesaiTugas({
    required String tugasId,
    required String lokasiTujuan,
  }) async {
    final res = await http
        .patch(
          ApiConfig.uri('/api/permintaan/tugas/$tugasId'),
          headers: await authHeaders(),
          body: jsonEncode({
            'statusTugas': 'SELESAI',
            'lokasiTujuan': lokasiTujuan.trim(),
          }),
        )
        .timeout(const Duration(seconds: 25));
    _ensureOk(res);
  }

  static void _ensureOk(http.Response res) {
    Map<String, dynamic>? decoded;
    try {
      decoded = jsonDecode(res.body) as Map<String, dynamic>?;
    } catch (_) {
      throw Exception('Respons server tidak valid.');
    }
    if (decoded == null || decoded['success'] != true) {
      throw Exception(decoded?['message']?.toString() ?? 'Permintaan gagal');
    }
  }
}
