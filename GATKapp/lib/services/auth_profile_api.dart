import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'api_client.dart';

/// GET /api/auth/me — profil user login.
class AuthProfileApi {
  AuthProfileApi._();

  static Future<Map<String, dynamic>> fetchMe() async {
    final res = await http
        .get(
          ApiConfig.uri('/api/auth/me'),
          headers: await authHeaders(),
        )
        .timeout(const Duration(seconds: 20));

    final decoded = jsonDecode(res.body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Respons tidak valid.');
    }
    if (decoded['success'] != true) {
      throw Exception(decoded['message']?.toString() ?? 'Gagal memuat profil');
    }
    final data = decoded['data'];
    if (data is! Map<String, dynamic>) throw Exception('Data tidak ada.');
    final u = data['user'];
    if (u is! Map<String, dynamic>) throw Exception('User tidak valid.');
    return u;
  }
}
