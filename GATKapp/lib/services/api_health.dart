import 'package:http/http.dart' as http;

import '../config/api_config.dart';

/// Panggil GET /api/health — cocok untuk tes HP bisa jangkau PC atau belum.
Future<String> checkApiHealth() async {
  final response = await http.get(ApiConfig.uri('/api/health'))
      .timeout(const Duration(seconds: 10));
  return 'HTTP ${response.statusCode}\n${response.body}';
}
