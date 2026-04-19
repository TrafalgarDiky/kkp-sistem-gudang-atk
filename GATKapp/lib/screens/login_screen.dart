import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_health.dart';
import '../services/auth_api.dart';
import '../services/auth_storage.dart';
import '../theme/gatk_brand.dart';
import '../widgets/gatk_brand_logo.dart';
import '../widgets/gatk_decorative_background.dart';
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
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => PetugasHomeScreen(user: user),
        ),
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Health: $e'),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  InputDecoration _fieldDecoration(String label, {Widget? suffix}) {
    final borderColor = GatkBrand.borderDark;
    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: borderColor),
    );
    return InputDecoration(
      labelText: label,
      suffixIcon: suffix,
      filled: true,
      fillColor: GatkBrand.surfaceDark,
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      labelStyle: GoogleFonts.plusJakartaSans(
        color: GatkBrand.textOnDarkMuted,
        fontWeight: FontWeight.w500,
      ),
      floatingLabelStyle: GoogleFonts.plusJakartaSans(
        color: GatkBrand.logoSky,
        fontWeight: FontWeight.w600,
      ),
      border: border,
      enabledBorder: border,
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: GatkBrand.blue, width: 2),
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
        body: Stack(
          children: [
            const GatkDecorativeBackground(dark: true),
            Center(
              child: CircularProgressIndicator(
                color: GatkBrand.logoSky,
                strokeWidth: 2.5,
              ),
            ),
          ],
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
          const GatkDecorativeBackground(dark: true),
          SafeArea(
            child: SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(24, 16, 24, 24 + bottomPad),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                      const GatkBrandLogoBlock(compact: true),
                      const SizedBox(height: 10),
                      Text(
                        'Masuk dengan akun yang sudah diverifikasi admin.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          height: 1.45,
                          color: GatkBrand.textOnDarkMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 32),
                      Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextFormField(
                              controller: _emailCtrl,
                              keyboardType: TextInputType.emailAddress,
                              autofillHints: const [AutofillHints.email],
                              style: GoogleFonts.plusJakartaSans(
                                color: GatkBrand.textOnDark,
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
                            FilledButton(
                              style: FilledButton.styleFrom(
                                backgroundColor: GatkBrand.blue,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                elevation: 0,
                                shadowColor: GatkBrand.blue.withValues(alpha: 0.35),
                              ),
                              onPressed: _loading ? null : _submit,
                              child: _loading
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
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      TextButton.icon(
                        onPressed: _loading ? null : _testHealth,
                        icon: Icon(
                          Icons.dns_rounded,
                          size: 18,
                          color: GatkBrand.textOnDarkMuted,
                        ),
                        label: Text(
                          'Cek koneksi server',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: GatkBrand.textOnDarkMuted,
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
