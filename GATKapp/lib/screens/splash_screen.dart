import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/gatk_brand.dart';
import '../widgets/gatk_brand_logo.dart';
import 'login_screen.dart';

/// Splash — blob, logo GATK + tagline, pill, dots, versi.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {

  late final AnimationController _blobCtrl;
  late final AnimationController _entryCtrl;
  late final AnimationController _dotsCtrl;
  late final AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _blobCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);

    _entryCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..forward();

    _dotsCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    Future<void>.delayed(const Duration(milliseconds: 2800), () {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      );
    });
  }

  @override
  void dispose() {
    _blobCtrl.dispose();
    _entryCtrl.dispose();
    _dotsCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: GatkBrand.bgDark,
      body: Stack(
        clipBehavior: Clip.none,
        children: [
          AnimatedBuilder(
            animation: _blobCtrl,
            builder: (context, _) {
              final t = _blobCtrl.value;
              return Stack(
                children: [
                  _blob(
                    top: -80 + 20 * t,
                    left: -80 + 20 * t,
                    size: 340,
                    color: GatkBrand.blobDark1.withValues(alpha: 0.2),
                  ),
                  _blob(
                    bottom: -60 + 15 * (1 - t),
                    right: -60 + 15 * (1 - t),
                    size: 260,
                    color: GatkBrand.blobDark2.withValues(alpha: 0.18),
                  ),
                  _blob(
                    bottom: 0.2 * MediaQuery.sizeOf(context).height - 40 * t,
                    left: 0.05 * MediaQuery.sizeOf(context).width + 10 * t,
                    size: 180,
                    color: GatkBrand.blobDark3.withValues(alpha: 0.18),
                  ),
                ],
              );
            },
          ),
          SafeArea(
            child: Center(
              child: AnimatedBuilder(
                animation: _entryCtrl,
                builder: (context, _) {
                  final p = _entryCtrl.value;

                  double fadeUp(double start, double end) {
                    if (p <= start) return 0;
                    if (p >= end) return 1;
                    return (p - start) / (end - start);
                  }

                  double slide(double start, double end) {
                    final v = fadeUp(start, end);
                    return 14 * (1 - v);
                  }

                  final iconT = CurvedAnimation(
                    parent: _entryCtrl,
                    curve: const Interval(0.05, 0.42, curve: Curves.easeOutBack),
                  ).value;

                  return Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Transform.translate(
                        offset: Offset(0, 10 * (1 - iconT)),
                        child: Transform.scale(
                          scale: 0.6 + 0.4 * iconT,
                          child: Opacity(
                            opacity: iconT.clamp(0.0, 1.0),
                            child: const GatkBrandLogoBlock(compact: false),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Opacity(
                        opacity: fadeUp(0.45, 0.72),
                        child: Transform.translate(
                          offset: Offset(0, slide(0.45, 0.72)),
                          child: _pill(),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 52,
            child: AnimatedBuilder(
              animation: Listenable.merge([_entryCtrl, _dotsCtrl]),
              builder: (context, _) {
                final dotsIn = ((_entryCtrl.value - 0.55) / 0.25).clamp(0.0, 1.0);
                return Opacity(
                  opacity: dotsIn,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(3, (i) {
                      final phase = (_dotsCtrl.value + i * 0.12) % 1.0;
                      final active = phase < 0.5;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3.5),
                        child: Transform.scale(
                          scale: active ? 1.25 : 1.0,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: active
                                  ? GatkBrand.logoSky
                                  : const Color(0xFF475569),
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                );
              },
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 18,
            child: Text(
              'v1.0.0',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: GatkBrand.textOnDarkMuted,
                letterSpacing: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _blob({
    double? top,
    double? left,
    double? bottom,
    double? right,
    required double size,
    required Color color,
  }) {
    return Positioned(
      top: top,
      left: left,
      bottom: bottom,
      right: right,
      child: IgnorePointer(
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: color,
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.3),
                blurRadius: 72,
                spreadRadius: 0,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pill() {
    return AnimatedBuilder(
      animation: _pulseCtrl,
      builder: (context, _) {
        final pulse = 3 + 3 * math.sin(_pulseCtrl.value * math.pi * 2);
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
          decoration: BoxDecoration(
            color: GatkBrand.surfaceDark,
            borderRadius: BorderRadius.circular(99),
            border: Border.all(color: GatkBrand.borderDark),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.35),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 7,
                height: 7,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF22C55E),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF22C55E).withValues(alpha: 0.35),
                      blurRadius: pulse,
                      spreadRadius: 0,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 7),
              Text(
                'Portal Petugas',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: GatkBrand.textOnDark,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
