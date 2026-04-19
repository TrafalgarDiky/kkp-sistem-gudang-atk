/// Model ringkas mengikuti GET /api/permintaan/tugas (nested permintaan + petugas).
class TugasPetugas {
  TugasPetugas({
    required this.id,
    required this.permintaanId,
    this.petugasId,
    required this.statusTugas,
    this.lokasiTujuan,
    this.createdAt,
    this.updatedAt,
    this.permintaan,
    this.petugas,
  });

  final String id;
  final String permintaanId;
  final String? petugasId;
  final String statusTugas;
  final String? lokasiTujuan;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final PermintaanRingkas? permintaan;
  final PetugasRingkas? petugas;

  factory TugasPetugas.fromJson(Map<String, dynamic> json) {
    return TugasPetugas(
      id: json['id']?.toString() ?? '',
      permintaanId: json['permintaanId']?.toString() ?? '',
      petugasId: json['petugasId']?.toString(),
      statusTugas: json['statusTugas'] as String? ?? '',
      lokasiTujuan: json['lokasiTujuan'] as String?,
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      permintaan: json['permintaan'] is Map<String, dynamic>
          ? PermintaanRingkas.fromJson(
              json['permintaan'] as Map<String, dynamic>,
            )
          : null,
      petugas: json['petugas'] is Map<String, dynamic>
          ? PetugasRingkas.fromJson(json['petugas'] as Map<String, dynamic>)
          : null,
    );
  }

  static DateTime? _parseDate(Object? v) {
    if (v == null) return null;
    return DateTime.tryParse(v.toString());
  }

  bool get ditolakAdmin =>
      permintaan?.statusAdmin == 'DITOLAK_ADMIN';
}

class PetugasRingkas {
  PetugasRingkas({this.id, this.nama});

  final String? id;
  final String? nama;

  factory PetugasRingkas.fromJson(Map<String, dynamic> json) {
    return PetugasRingkas(
      id: json['id']?.toString(),
      nama: json['nama'] as String?,
    );
  }
}

class PermintaanRingkas {
  PermintaanRingkas({
    this.kode,
    this.statusAdmin,
    this.createdAt,
    this.peminta,
    this.items,
  });

  final String? kode;
  final String? statusAdmin;
  final DateTime? createdAt;
  final PemintaRingkas? peminta;
  final List<PermintaanItemRingkas>? items;

  factory PermintaanRingkas.fromJson(Map<String, dynamic> json) {
    List<PermintaanItemRingkas>? items;
    final raw = json['items'];
    if (raw is List) {
      items = raw
          .whereType<Map<String, dynamic>>()
          .map(PermintaanItemRingkas.fromJson)
          .toList();
    }
    return PermintaanRingkas(
      kode: json['kode'] as String?,
      statusAdmin: json['statusAdmin'] as String?,
      createdAt: TugasPetugas._parseDate(json['createdAt']),
      peminta: json['peminta'] is Map<String, dynamic>
          ? PemintaRingkas.fromJson(json['peminta'] as Map<String, dynamic>)
          : null,
      items: items,
    );
  }
}

class PemintaRingkas {
  PemintaRingkas({this.nama, this.email, this.divisi});

  final String? nama;
  final String? email;
  final String? divisi;

  factory PemintaRingkas.fromJson(Map<String, dynamic> json) {
    return PemintaRingkas(
      nama: json['nama'] as String?,
      email: json['email'] as String?,
      divisi: json['divisi'] as String?,
    );
  }
}

class PermintaanItemRingkas {
  PermintaanItemRingkas({this.jumlah, this.barang});

  final int? jumlah;
  final BarangRingkas? barang;

  factory PermintaanItemRingkas.fromJson(Map<String, dynamic> json) {
    return PermintaanItemRingkas(
      jumlah: json['jumlah'] is int
          ? json['jumlah'] as int
          : int.tryParse('${json['jumlah']}'),
      barang: json['barang'] is Map<String, dynamic>
          ? BarangRingkas.fromJson(json['barang'] as Map<String, dynamic>)
          : null,
    );
  }
}

class BarangRingkas {
  BarangRingkas({this.nama, this.satuan});

  final String? nama;
  final String? satuan;

  factory BarangRingkas.fromJson(Map<String, dynamic> json) {
    return BarangRingkas(
      nama: json['nama'] as String?,
      satuan: json['satuan'] as String?,
    );
  }
}

/// Statistik dashboard petugas (sama logika dengan PetugasDashboard.js web).
class PetugasDashboardStats {
  PetugasDashboardStats({
    required this.tersedia,
    required this.sayaAktif,
    required this.selesaiHariIni,
  });

  final int tersedia;
  final int sayaAktif;
  final int selesaiHariIni;

  static PetugasDashboardStats compute(
    List<TugasPetugas> tugas,
    String meId,
  ) {
    var tersedia = 0;
    var sayaAktif = 0;
    var selesaiHariIni = 0;

    for (final t in tugas) {
      if (t.ditolakAdmin) continue;

      if (t.statusTugas == 'MENUNGGU_ASSIGN' &&
          (t.petugasId == null || t.petugasId!.isEmpty)) {
        tersedia += 1;
        continue;
      }
      if (t.petugasId == meId) {
        if (const {
          'MENUNGGU_ASSIGN',
          'DALAM_PROSES',
          'ON_DELIVERY',
        }.contains(t.statusTugas)) {
          sayaAktif += 1;
        } else if (const {'SELESAI', 'DELIVERED'}.contains(t.statusTugas)) {
          final d = t.updatedAt ?? t.createdAt;
          if (_isToday(d)) selesaiHariIni += 1;
        }
      }
    }
    return PetugasDashboardStats(
      tersedia: tersedia,
      sayaAktif: sayaAktif,
      selesaiHariIni: selesaiHariIni,
    );
  }

  static bool _isToday(DateTime? dt) {
    if (dt == null) return false;
    final now = DateTime.now();
    return dt.year == now.year &&
        dt.month == now.month &&
        dt.day == now.day;
  }
}
