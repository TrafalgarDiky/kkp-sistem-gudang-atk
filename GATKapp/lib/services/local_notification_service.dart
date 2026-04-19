import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Notifikasi lokal Android saat ada tugas baru di antrian (polling, tanpa FCM).
class LocalNotificationService {
  LocalNotificationService._();
  static final LocalNotificationService instance = LocalNotificationService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _inited = false;

  Future<void> init() async {
    if (_inited) return;

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings();
    const settings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );
    await _plugin.initialize(settings);

    final androidImpl = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidImpl?.requestNotificationsPermission();

    const channel = AndroidNotificationChannel(
      'tugas_baru',
      'Tugas baru',
      description: 'Notifikasi saat ada tugas di antrian untuk petugas',
      importance: Importance.defaultImportance,
    );
    await androidImpl?.createNotificationChannel(channel);

    _inited = true;
  }

  /// Satu notifikasi ringkas (dipanggil per ID tugas baru terdeteksi).
  Future<void> showTugasBaru() async {
    if (!_inited) await init();
    final id = DateTime.now().millisecondsSinceEpoch.remainder(1 << 31);
    await _plugin.show(
      id,
      'Tugas baru',
      'Ada tugas baru yang bisa diambil di Daftar Tugas.',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'tugas_baru',
          'Tugas baru',
          channelDescription: 'Notifikasi saat ada tugas di antrian untuk petugas',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }
}
