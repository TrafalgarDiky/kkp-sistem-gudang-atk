import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/auth_user.dart';

class LoginResult {
  LoginResult({required this.token, required this.user});

  final String token;
  final AuthUser user;
}

/// POST /api/auth/login — body { email, password }.
Future<LoginResult> login({
  required String email,
  required String password,
}) async {
  final response = await http
      .post(
        ApiConfig.uri('/api/auth/login'),
        headers: {'Content-Type': 'application/json; charset=utf-8'},
        body: jsonEncode({
          'email': email.trim(),
          'password': password,
        }),
      )
      .timeout(const Duration(seconds: 20));

  Map<String, dynamic> decoded;
  try {
    decoded = jsonDecode(response.body) as Map<String, dynamic>;
  } catch (_) {
    throw Exception('Respons server tidak valid (bukan JSON).');
  }

  if (decoded['success'] != true) {
    final msg = decoded['message']?.toString() ?? 'Login gagal';
    throw Exception(msg);
  }

  final data = decoded['data'];
  if (data is! Map<String, dynamic>) {
    throw Exception('Data login tidak ditemukan.');
  }

  final token = data['token'] as String?;
  final userRaw = data['user'];
  if (token == null || token.isEmpty) {
    throw Exception('Token tidak dikembalikan server.');
  }
  if (userRaw is! Map<String, dynamic>) {
    throw Exception('Data user tidak valid.');
  }

  return LoginResult(
    token: token,
    user: AuthUser.fromJson(userRaw),
  );
}
