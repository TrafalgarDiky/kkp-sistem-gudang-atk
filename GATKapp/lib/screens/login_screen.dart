import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_health.dart';
import '../services/auth_api.dart';
import '../services/auth_storage.dart';
import '../services/push_notification_service.dart';
import '../theme/gatk_brand.dart';
import 'petugas_home_screen.dart';

/// Login petugas — tema selaras splash (latar gelap, Plus Jakarta Sans).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  bool _loading = false;
  bool _booting = true;
  bool _obscure = true;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final token = await AuthStorage.readToken();
    final user = await AuthStorage.readUser();
    if (!mounted) return;
    if (token != null && token.isNotEmpty && user != null) {
      await _registerPushToken();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => PetugasHomeScreen(user: user)),
      );
      return;
    }
    setState(() => _booting = false);
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _loading = true);
    try {
      final result = await login(
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
      );
      await AuthStorage.saveSession(result.token, result.user);
      await _registerPushToken();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => PetugasHomeScreen(user: result.user),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$e'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _registerPushToken() async {
    try {
      await PushNotificationService.instance.registerDeviceToken();
    } catch (_) {
      // Login tetap lanjut meski izin/koneksi FCM sedang bermasalah.
    }
  }

  Future<void> _testHealth() async {
    try {
      final text = await checkApiHealth();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(text),
          duration: const Duration(seconds: 5),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Health: $e'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
    }
  }

  InputDecoration _fieldDecoration(String label, {Widget? suffix}) {
    final borderColor = GatkBrand.logoSky.withValues(alpha: 0.22);
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: borderColor),
    );
    return InputDecoration(
      labelText: label,
      suffixIcon: suffix,
      filled: true,
      fillColor: GatkBrand.bgDark.withValues(alpha: 0.42),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      labelStyle: GoogleFonts.plusJakartaSans(
        color: GatkBrand.textOnDarkMuted,
        fontWeight: FontWeight.w600,
      ),
      floatingLabelStyle: GoogleFonts.plusJakartaSans(
        color: GatkBrand.logoSky,
        fontWeight: FontWeight.w700,
      ),
      border: border,
      enabledBorder: border,
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GatkBrand.logoSky, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.red.shade400),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_booting) {
      return Scaffold(
        backgroundColor: GatkBrand.bgDark,
        body: const Center(
          child: CircularProgressIndicator(
            color: GatkBrand.logoSky,
            strokeWidth: 2.5,
          ),
        ),
      );
    }

    final viewInsets = MediaQuery.viewInsetsOf(context);
    final bottomPad = viewInsets.bottom;

    return Scaffold(
      backgroundColor: GatkBrand.bgDark,

      /// Keyboard menutupi bagian bawah layar; isi tidak ikut "diangkat" penuh.
      /// Padding bawah = ruang scroll supaya field bisa digeser ke atas teks keyboard.
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          const _InventoryLoginBackground(),
          SafeArea(
            child: SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(24, 16, 24, 24 + bottomPad),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 22),
                  const _LoginBrandHeader(),
                  const SizedBox(height: 96),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: GatkBrand.surfaceDark.withValues(alpha: 0.42),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.12),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.28),
                              blurRadius: 32,
                              offset: const Offset(0, 16),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(
                                'Masuk Petugas',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w800,
                                  color: GatkBrand.textOnDark,
                                  letterSpacing: -0.4,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Gunakan akun yang sudah diverifikasi admin.',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 13,
                                  height: 1.4,
                                  fontWeight: FontWeight.w500,
                                  color: GatkBrand.textOnDarkMuted,
                                ),
                              ),
                              const SizedBox(height: 20),
                              TextFormField(
                                controller: _emailCtrl,
                                keyboardType: TextInputType.emailAddress,
                                autofillHints: const [AutofillHints.email],
                                style: GoogleFonts.plusJakartaSans(
                                  color: GatkBrand.textOnDark,
                                  fontWeight: FontWeight.w600,
                                ),
                                cursorColor: GatkBrand.logoSky,
                                decoration: _fieldDecoration('Email'),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'Email wajib diisi';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 14),
                              TextFormField(
                                controller: _passwordCtrl,
                                obscureText: _obscure,
                                autofillHints: const [AutofillHints.password],
                                style: GoogleFonts.plusJakartaSans(
                                  color: GatkBrand.textOnDark,
                                  fontWeight: FontWeight.w600,
                                ),
                                cursorColor: GatkBrand.logoSky,
                                decoration: _fieldDecoration(
                                  'Password',
                                  suffix: IconButton(
                                    icon: Icon(
                                      _obscure
                                          ? Icons.visibility_rounded
                                          : Icons.visibility_off_rounded,
                                      color: GatkBrand.textOnDarkMuted,
                                    ),
                                    onPressed: () =>
                                        setState(() => _obscure = !_obscure),
                                  ),
                                ),
                                validator: (v) {
                                  if (v == null || v.isEmpty) {
                                    return 'Password wajib diisi';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 24),
                              _GradientLoginButton(
                                loading: _loading,
                                onPressed: _loading ? null : _submit,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: _loading ? null : _testHealth,
                    style: TextButton.styleFrom(
                      foregroundColor: GatkBrand.textOnDarkMuted,
                    ),
                    icon: const Icon(Icons.dns_rounded, size: 18),
                    label: Text(
                      'Cek koneksi server',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LoginBrandHeader extends StatelessWidget {
  const _LoginBrandHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: GatkBrand.logoNavy,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: GatkBrand.logoSky.withValues(alpha: 0.62),
                  ),
                ),
                child: Image.asset('assets/branding/app_icon.png'),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: 'GA',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 38,
                            fontWeight: FontWeight.w800,
                            height: 0.95,
                            letterSpacing: -1.8,
                            color: GatkBrand.logoSky,
                          ),
                        ),
                        TextSpan(
                          text: 'TK',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 38,
                            fontWeight: FontWeight.w800,
                            height: 0.95,
                            letterSpacing: -1.2,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 7),
                  Text(
                    'G U D A N G   A T K',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 4,
                      color: GatkBrand.logoSky.withValues(alpha: 0.72),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Sistem Informasi Gudang Alat Tulis Kantor',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              height: 1.45,
              letterSpacing: 1.35,
              color: GatkBrand.logoSky.withValues(alpha: 0.68),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _InventoryLoginBackground extends StatelessWidget {
  const _InventoryLoginBackground();

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: DecoratedBox(
        decoration: const BoxDecoration(color: GatkBrand.bgDark),
        child: Stack(
          children: [
            Positioned(
              top: 70,
              left: -24,
              child: _WatermarkIcon(
                icon: Icons.inventory_2_outlined,
                size: 130,
              ),
            ),
            Positioned(
              right: -18,
              bottom: 90,
              child: _WatermarkIcon(icon: Icons.edit_note_rounded, size: 150),
            ),
            Positioned(
              left: 34,
              bottom: 42,
              child: _WatermarkIcon(
                icon: Icons.local_shipping_outlined,
                size: 92,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WatermarkIcon extends StatelessWidget {
  const _WatermarkIcon({required this.icon, required this.size});

  final IconData icon;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Icon(
      icon,
      size: size,
      color: GatkBrand.logoSky.withValues(alpha: 0.045),
    );
  }
}

class _GradientLoginButton extends StatelessWidget {
  const _GradientLoginButton({required this.loading, required this.onPressed});

  final bool loading;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: onPressed == null
                  ? [
                      GatkBrand.borderDark,
                      GatkBrand.borderDark.withValues(alpha: 0.8),
                    ]
                  : const [Color(0xFF0369A1), GatkBrand.logoSky],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: loading
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Masuk',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
