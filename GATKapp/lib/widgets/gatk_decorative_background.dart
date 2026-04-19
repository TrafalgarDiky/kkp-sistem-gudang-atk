import 'package:flutter/material.dart';

import '../theme/gatk_brand.dart';

/// Lingkaran lembut di belakang (versi statis, sama nuansa splash).
class GatkDecorativeBackground extends StatelessWidget {
  const GatkDecorativeBackground({
    super.key,
    this.dark = false,
  });

  /// `true` = blob lebih redup, cocok untuk [GatkBrand.bgDark].
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final h = MediaQuery.sizeOf(context).height;
    final w = MediaQuery.sizeOf(context).width;

    Widget blob({
      double? top,
      double? left,
      double? bottom,
      double? right,
      required double size,
      required Color color,
    }) {
      final fillAlpha = dark ? 0.22 : 0.38;
      final shadowAlpha = dark ? 0.18 : 0.25;
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
              color: color.withValues(alpha: fillAlpha),
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: shadowAlpha),
                  blurRadius: 64,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final c1 = dark ? GatkBrand.blobDark1 : GatkBrand.blob1;
    final c2 = dark ? GatkBrand.blobDark2 : GatkBrand.blob2;
    final c3 = dark ? GatkBrand.blobDark3 : GatkBrand.blob3;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        blob(top: -70, left: -70, size: 300, color: c1),
        blob(bottom: -50, right: -50, size: 240, color: c2),
        blob(
          bottom: h * 0.18,
          left: w * 0.02,
          size: 160,
          color: c3,
        ),
      ],
    );
  }
}
