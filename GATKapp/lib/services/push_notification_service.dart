import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import 'api_client.dart';
import 'auth_storage.dart';
import 'local_notification_service.dart';

/// Mengurus izin notifikasi, token FCM, dan kirim token ke backend.
class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  bool _inited = false;

  bool get _isAndroidApp =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  Future<void> init() async {
    if (!_isAndroidApp) return;
    if (_inited) return;
    _inited = true;

    await FirebaseMessaging.instance.requestPermission();
    await FirebaseMessaging.instance
        .setForegroundNotificationPresentationOptions(
          alert: true,
          badge: true,
          sound: true,
        );

    FirebaseMessaging.onMessage.listen((message) async {
      final title = message.notification?.title ?? 'Notifikasi';
      final body = message.notification?.body ?? 'Ada update baru.';
      await LocalNotificationService.instance.showNotification(
        title: title,
        body: body,
      );
    });

    FirebaseMessaging.instance.onTokenRefresh.listen((_) {
      registerDeviceToken();
    });
  }

  /// Kirim token HP ke backend. Dipanggil setelah user login/session ada.
  Future<void> registerDeviceToken() async {
    if (!_isAndroidApp) return;

    final tokenLogin = await AuthStorage.readToken();
    if (tokenLogin == null || tokenLogin.isEmpty) return;

    final fcmToken = await FirebaseMessaging.instance.getToken();
    if (fcmToken == null || fcmToken.isEmpty) return;

    final res = await http
        .post(
          ApiConfig.uri('/api/device-token'),
          headers: await authHeaders(),
          body: jsonEncode({'token': fcmToken, 'platform': 'android'}),
        )
        .timeout(const Duration(seconds: 20));

    final decoded = jsonDecode(res.body);
    if (decoded is! Map<String, dynamic> || decoded['success'] != true) {
      throw Exception(
        decoded is Map
            ? decoded['message']?.toString() ?? 'Gagal menyimpan token FCM'
            : 'Respons token FCM tidak valid.',
      );
    }
  }
}
