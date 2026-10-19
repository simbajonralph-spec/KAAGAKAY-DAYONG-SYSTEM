import 'package:flutter/material.dart';

class AppColors {
  // Brand Greens
  static const Color brand50 = Color(0xFFEEF7F1);
  static const Color brand100 = Color(0xFFD7ECDD);
  static const Color brand200 = Color(0xFFB0D9BD);
  static const Color brand300 = Color(0xFF80BF95);
  static const Color brand400 = Color(0xFF4FA070);
  static const Color brand500 = Color(0xFF2F8556);
  static const Color brand600 = Color(0xFF216B45);
  static const Color brand700 = Color(0xFF1A5637);
  static const Color brand800 = Color(0xFF154430);
  static const Color brand900 = Color(0xFF10352A);

  // Ink Darks
  static const Color ink700 = Color(0xFF243D33);
  static const Color ink800 = Color(0xFF183129);
  static const Color ink900 = Color(0xFF10231A);

  // Neutrals & Status
  static const Color background = Color(0xFFF1F5F9);
  static const Color card = Colors.white;
  static const Color textMain = Color(0xFF1E293B);
  static const Color textSub = Color(0xFF64748B);
  static const Color border = Color(0xFFE2E8F0);

  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF0284C7);
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Roboto',
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brand700,
      primary: AppColors.brand700,
      secondary: AppColors.brand500,
      surface: AppColors.card,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.ink900,
      foregroundColor: Colors.white,
      elevation: 2,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: AppColors.card,
      elevation: 0.5,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brand700,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.textMain,
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.brand600, width: 2),
      ),
      labelStyle: const TextStyle(color: AppColors.textSub, fontSize: 14),
      hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
    ),
  );
}
