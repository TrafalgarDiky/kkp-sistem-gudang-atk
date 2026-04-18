/// Data user dari API setelah login (field mengikuti backend).
class AuthUser {
  AuthUser({
    required this.id,
    required this.nama,
    required this.email,
    required this.role,
    this.divisi,
    required this.statusAkun,
  });

  final String id;
  final String nama;
  final String email;
  final String role;
  final String? divisi;
  final String statusAkun;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      id: json['id']?.toString() ?? '',
      nama: json['nama'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? '',
      divisi: json['divisi'] as String?,
      statusAkun: json['statusAkun'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'nama': nama,
        'email': email,
        'role': role,
        'divisi': divisi,
        'statusAkun': statusAkun,
      };
}
