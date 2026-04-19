import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'api_client.dart';

/// GET /api/permintaan/:id — detail item + catatan admin (untuk modal di app petugas).
class PermintaanApi {
  PermintaanApi._();

  static Future<Map<String, dynamic>> fetchById(String permintaanId) async {
    final res = await http
        .get(
          ApiConfig.uri('/api/permintaan/$permintaanId'),
          headers: await authHeaders(),
        )
        .timeout(const Duration(seconds: 25));

    final decoded = jsonDecode(res.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Respons tidak valid.');
    }
    if (decoded['success'] != true) {
      throw Exception(decoded['message']?.toString() ?? 'Gagal memuat detail');
    }
    final data = decoded['data'];
    if (data is! Map<String, dynamic>) {
      throw Exception('Data tidak ada.');
    }
    final p = data['permintaan'];
    if (p is! Map<String, dynamic>) {
      throw Exception('Permintaan tidak valid.');
    }
    return p;
  }
}
