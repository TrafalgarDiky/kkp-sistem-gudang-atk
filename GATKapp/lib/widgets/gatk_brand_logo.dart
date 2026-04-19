import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/gatk_brand.dart';

/// Badge gelap + teks GATK (GA biru, TK putih) + tagline dua baris.
class GatkBrandLogoBlock extends StatelessWidget {
  const GatkBrandLogoBlock({
    super.key,
    this.compact = false,
  });

  /// `true` = ukuran untuk login; `false` = splash lebih besar.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final badgeSize = compact ? 30.0 : 38.0;
    final tagSize = compact ? 12.0 : 13.0;
    final padH = compact ? 22.0 : 28.0;
    final padV = compact ? 11.0 : 14.0;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: EdgeInsets.symmetric(horizontal: padH, vertical: padV),
          decoration: BoxDecoration(
            color: GatkBrand.logoNavy,
            borderRadius: BorderRadius.circular(999),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: compact ? 20 : 28,
                offset: Offset(0, compact ? 8 : 12),
              ),
            ],
          ),
          child: Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: 'GA',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: badgeSize,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -1,
                    height: 1,
                    color: GatkBrand.logoSky,
                  ),
                ),
                TextSpan(
                  text: 'TK',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: badgeSize,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                    height: 1,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: compact ? 14 : 18),
        Text.rich(
          textAlign: TextAlign.center,
          TextSpan(
            children: [
              TextSpan(
                text: 'Memenuhi ',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: tagSize,
                  fontWeight: FontWeight.w500,
                  height: 1.45,
                  color: Colors.white,
                ),
              ),
              TextSpan(
                text: 'kebutuhan kerja',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: tagSize,
                  fontWeight: FontWeight.w600,
                  height: 1.45,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
        Text(
          'anda',
          textAlign: TextAlign.center,
          style: GoogleFonts.plusJakartaSans(
            fontSize: tagSize,
            fontWeight: FontWeight.w500,
            height: 1.35,
            color: Colors.white,
          ),
        ),
      ],
    );
  }
}
