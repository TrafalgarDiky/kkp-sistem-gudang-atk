import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'gatk_brand.dart';

/// Tema ringkas Material 3 — permukaan lembut, kontras jelas, cocok layar petugas.
ThemeData buildAppTheme() {
  const seed = Color(0xFF5B4FCF);
  final scheme = ColorScheme.fromSeed(
    seedColor: seed,
    brightness: Brightness.light,
    surfaceContainerLowest: const Color(0xFFF8F7FC),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: scheme.surfaceContainerLowest,
    appBarTheme: AppBarTheme(
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      backgroundColor: scheme.surfaceContainerLowest,
      foregroundColor: scheme.onSurface,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        color: scheme.onSurface,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: scheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.35)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      elevation: 0,
      backgroundColor: scheme.surface,
      indicatorColor: scheme.primaryContainer,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final small = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: small ? 12 : 11,
          fontWeight: small ? FontWeight.w600 : FontWeight.w500,
        );
      }),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        shape: WidgetStateProperty.all(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    ),
  );
}

/// Tema gelap untuk shell petugas (Beranda / Tugas / Riwayat / Profil) — navy + sky blue.
ThemeData buildPetugasShellTheme() {
  const sky = GatkBrand.logoSky;
  const navy = GatkBrand.logoNavy;

  final scheme = ColorScheme.dark(
    primary: sky,
    onPrimary: Colors.white,
    primaryContainer: Color(0xFF0C4A6E),
    onPrimaryContainer: Color(0xFFE0F2FE),
    secondary: sky,
    onSecondary: Colors.white,
    surface: GatkBrand.surfaceDark,
    onSurface: GatkBrand.textOnDark,
    onSurfaceVariant: GatkBrand.textOnDarkMuted,
    error: Color(0xFFF87171),
    outline: GatkBrand.borderDark,
    outlineVariant: Color(0xFF334155),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: navy,
    appBarTheme: AppBarTheme(
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: navy,
      foregroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: GoogleFonts.plusJakartaSans(
        fontSize: 22,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.4,
        color: Colors.white,
      ),
      iconTheme: const IconThemeData(color: Colors.white),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: GatkBrand.surfaceDark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: GatkBrand.borderDark.withValues(alpha: 0.65),
        ),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      elevation: 0,
      height: 72,
      backgroundColor: GatkBrand.surfaceDark,
      indicatorColor: sky.withValues(alpha: 0.28),
      surfaceTintColor: Colors.transparent,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final sel = states.contains(WidgetState.selected);
        return GoogleFonts.plusJakartaSans(
          fontSize: 12,
          fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
          color: sel ? sky : GatkBrand.textOnDarkMuted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final sel = states.contains(WidgetState.selected);
        return IconThemeData(
          color: sel ? sky : GatkBrand.textOnDarkMuted,
          size: 24,
        );
      }),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    textTheme: TextTheme(
      bodyLarge: GoogleFonts.plusJakartaSans(color: GatkBrand.textOnDark),
      bodyMedium: GoogleFonts.plusJakartaSans(color: GatkBrand.textOnDarkMuted),
      titleLarge: GoogleFonts.plusJakartaSans(
        color: GatkBrand.textOnDark,
        fontWeight: FontWeight.w700,
      ),
    ),
  );
}
