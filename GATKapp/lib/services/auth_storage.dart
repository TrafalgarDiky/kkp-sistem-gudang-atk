import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_user.dart';

const _keyToken = 'auth_token';
const _keyUser = 'auth_user_json';

/// Simpan token & profil di memori HP (SharedPreferences).
class AuthStorage {
  static Future<void> saveSession(String token, AuthUser user) async {
    final p = await SharedPreferences.getInstance();
    await p.setString(_keyToken, token);
    await p.setString(_keyUser, jsonEncode(user.toJson()));
  }

  static Future<String?> readToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString(_keyToken);
  }

  static Future<AuthUser?> readUser() async {
    final p = await SharedPreferences.getInstance();
    final raw = p.getString(_keyUser);
    if (raw == null || raw.isEmpty) return null;
    return AuthUser.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  static Future<void> clear() async {
    final p = await SharedPreferences.getInstance();
    await p.remove(_keyToken);
    await p.remove(_keyUser);
  }
}
