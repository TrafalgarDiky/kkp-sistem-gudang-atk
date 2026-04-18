/// Alamat backend di jaringan lokal (HP harus WiFi sama dengan PC).
/// Ganti IP jika IP PC berubah (cek `ipconfig` di Windows).
class ApiConfig {
  static const String baseUrl = 'http://192.168.1.7:3001';

  /// Gabungkan path API, contoh: uri('/api/health')
  static Uri uri(String path) {
    final p = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$baseUrl$p');
  }
}
