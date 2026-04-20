/// Alamat backend API.
///
/// **Default:** production di Railway (HTTPS).
/// **Lokal:** jalankan dengan override, misalnya:
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.7:3001`
class ApiConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://kkp-sistem-gudang-atk-production.up.railway.app',
  );

  /// Gabungkan path API, contoh: uri('/api/health')
  static Uri uri(String path) {
    final p = path.startsWith('/') ? path : '/$path';
    final base = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    return Uri.parse('$base$p');
  }
}
