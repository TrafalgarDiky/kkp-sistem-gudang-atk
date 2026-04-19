import 'auth_storage.dart';

/// Header Authorization Bearer untuk endpoint yang membutuhkan login.
Future<Map<String, String>> authHeaders() async {
  final token = await AuthStorage.readToken();
  return {
    'Content-Type': 'application/json; charset=utf-8',
    if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
  };
}
