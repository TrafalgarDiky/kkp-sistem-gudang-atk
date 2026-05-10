import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/gatk_brand.dart';
import 'login_screen.dart';

/// Splash awal aplikasi: logo GATK, subtitle, dan indikator loading.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _entryCtrl;
  late final AnimationController _dotsCtrl;

  @override
  void initState() {
    super.initState();
    _entryCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward();

    _dotsCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    Future<void>.delayed(const Duration(seconds: 8), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      );
    });
  }

  @override
  void dispose() {
    _entryCtrl.dispose();
    _dotsCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GatkBrand.bgDark,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: AnimatedBuilder(
              animation: _entryCtrl,
              builder: (context, _) {
                final logoIn = CurvedAnimation(
                  parent: _entryCtrl,
                  curve: const Interval(0, 0.65, curve: Curves.easeOutCubic),
                ).value;
                final textIn = CurvedAnimation(
                  parent: _entryCtrl,
                  curve: const Interval(0.35, 1, curve: Curves.easeOutCubic),
                ).value;

                return Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Transform.translate(
                      offset: Offset(0, 16 * (1 - logoIn)),
                      child: Opacity(
                        opacity: logoIn,
                        child: const _SplashBrandMark(),
                      ),
                    ),
                    const SizedBox(height: 72),
                    Transform.translate(
                      offset: Offset(0, 12 * (1 - textIn)),
                      child: Opacity(
                        opacity: textIn,
                        child: Text(
                          'Sistem Informasi Gudang Alat Tulis Kantor',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 2.2,
                            color: GatkBrand.logoSky.withValues(alpha: 0.62),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 38),
                    AnimatedBuilder(
                      animation: _dotsCtrl,
                      builder: (context, _) =>
                          _LoadingDots(value: _dotsCtrl.value),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _SplashBrandMark extends StatelessWidget {
  const _SplashBrandMark();

  @override
  Widget build(BuildContext context) {
    return FittedBox(
      fit: BoxFit.scaleDown,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 118,
            height: 118,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: GatkBrand.logoNavy,
              borderRadius: BorderRadius.circular(30),
              border: Border.all(
                color: GatkBrand.logoSky.withValues(alpha: 0.72),
                width: 2,
              ),
              boxShadow: [
                BoxShadow(
                  color: GatkBrand.logoSky.withValues(alpha: 0.16),
                  blurRadius: 28,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Image.asset('assets/branding/app_icon.png'),
          ),
          const SizedBox(width: 34),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: 'GA',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 68,
                        fontWeight: FontWeight.w800,
                        height: 0.95,
                        letterSpacing: -3,
                        color: GatkBrand.logoSky,
                      ),
                    ),
                    TextSpan(
                      text: 'TK',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 68,
                        fontWeight: FontWeight.w800,
                        height: 0.95,
                        letterSpacing: -2,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Text(
                'G U D A N G   A T K',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 6,
                  color: GatkBrand.logoSky.withValues(alpha: 0.72),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LoadingDots extends StatelessWidget {
  const _LoadingDots({required this.value});

  final double value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        final phase = (value + i * 0.14) % 1.0;
        final active = phase < 0.5;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.symmetric(horizontal: 7),
          width: active ? 13 : 12,
          height: active ? 13 : 12,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active
                ? GatkBrand.logoSky
                : GatkBrand.logoSky.withValues(alpha: 0.35),
          ),
        );
      }),
    );
  }
}
