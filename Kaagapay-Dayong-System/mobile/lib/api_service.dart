import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String _tokenKey = 'kd_mobile_jwt_token';

  // Base URL configuration:
  // - Android emulator: http://10.0.2.2:5000
  // - Windows desktop / Web / iOS simulator: http://127.0.0.1:5000
  static String get baseUrl {
    if (kIsWeb) return 'http://127.0.0.1:5000';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000';
    }
    return 'http://127.0.0.1:5000';
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> setToken(String? token) async {
    final prefs = await SharedPreferences.getInstance();
    if (token != null) {
      await prefs.setString(_tokenKey, token);
    } else {
      await prefs.remove(_tokenKey);
    }
  }

  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    final headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  static Future<dynamic> _handleResponse(http.Response response) {
    dynamic data;
    try {
      data = jsonDecode(response.body);
    } catch (_) {
      data = {'error': response.body};
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return Future.value(data);
    } else {
      final msg = data is Map ? (data['error'] ?? data['message'] ?? 'Request failed') : 'Request failed';
      throw Exception(msg);
    }
  }

  // --- Auth ---
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = await _handleResponse(res);
    if (data['token'] != null) {
      await setToken(data['token']);
    }
    return data;
  }

  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
    required String municipality,
    required String barangay,
  }) async {
    final res = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
        'municipality': municipality,
        'barangay': barangay,
      }),
    );
    return await _handleResponse(res);
  }

  static Future<Map<String, dynamic>> getMe() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/auth/me'), headers: headers);
    return await _handleResponse(res);
  }

  static Future<void> logout() async {
    await setToken(null);
  }

  static Future<void> resetDemo() async {
    await http.post(Uri.parse('$baseUrl/api/auth/reset-demo'));
    await logout();
  }

  // --- Member ---
  static Future<Map<String, dynamic>> getMemberDashboard() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/member/dashboard'), headers: headers);
    return await _handleResponse(res);
  }

  static Future<List<dynamic>> getBeneficiaries() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/member/beneficiaries'), headers: headers);
    final data = await _handleResponse(res);
    return data['beneficiaries'] ?? [];
  }

  static Future<void> addBeneficiary(String name, String relation, String dob) async {
    final headers = await _headers();
    final res = await http.post(
      Uri.parse('$baseUrl/api/member/beneficiaries'),
      headers: headers,
      body: jsonEncode({'name': name, 'relation': relation, 'dob': dob}),
    );
    await _handleResponse(res);
  }

  static Future<void> removeBeneficiary(String id) async {
    final headers = await _headers();
    final res = await http.delete(Uri.parse('$baseUrl/api/member/beneficiaries/$id'), headers: headers);
    await _handleResponse(res);
  }

  static Future<List<dynamic>> getMemberPayments() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/member/payments'), headers: headers);
    final data = await _handleResponse(res);
    return data['payments'] ?? [];
  }

  static Future<void> submitPayment({
    required String dueId,
    required String method,
    required String refNo,
    required double amount,
    required String date,
    String? proofBase64,
  }) async {
    final headers = await _headers();
    final res = await http.post(
      Uri.parse('$baseUrl/api/member/payments'),
      headers: headers,
      body: jsonEncode({
        'due_id': dueId,
        'method': method,
        'ref_no': refNo,
        'amount': amount,
        'payment_date': date,
        'proofBase64': proofBase64,
      }),
    );
    await _handleResponse(res);
  }

  static Future<List<dynamic>> getMemberClaims() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/member/claims'), headers: headers);
    final data = await _handleResponse(res);
    return data['claims'] ?? [];
  }

  static Future<void> submitClaim({
    required String beneficiaryId,
    required String dateOfDeath,
    required String cause,
    required String place,
    required List<String> benefitIds,
    required String deathCertBase64,
  }) async {
    final headers = await _headers();
    final res = await http.post(
      Uri.parse('$baseUrl/api/member/claims'),
      headers: headers,
      body: jsonEncode({
        'beneficiary_id': beneficiaryId,
        'date_of_death': dateOfDeath,
        'cause': cause,
        'place': place,
        'benefit_ids': benefitIds,
        'deathCertBase64': deathCertBase64,
      }),
    );
    await _handleResponse(res);
  }

  static Future<List<dynamic>> getBenefitTypes() async {
    final res = await http.get(Uri.parse('$baseUrl/api/benefit-types'));
    final data = await _handleResponse(res);
    return data['benefitTypes'] ?? [];
  }

  // --- Admin ---
  static Future<Map<String, dynamic>> getAdminOverview() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/admin/overview'), headers: headers);
    return await _handleResponse(res);
  }

  static Future<List<dynamic>> getRegistrations() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/admin/registrations'), headers: headers);
    final data = await _handleResponse(res);
    return data['registrations'] ?? [];
  }

  static Future<List<dynamic>> getAdminMembers() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/admin/members'), headers: headers);
    final data = await _handleResponse(res);
    return data['members'] ?? [];
  }

  static Future<void> updateUserStatus(String id, String status) async {
    final headers = await _headers();
    final res = await http.patch(
      Uri.parse('$baseUrl/api/admin/users/$id/status'),
      headers: headers,
      body: jsonEncode({'status': status}),
    );
    await _handleResponse(res);
  }

  static Future<List<dynamic>> getAdminPayments() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/admin/payments'), headers: headers);
    final data = await _handleResponse(res);
    return data['payments'] ?? [];
  }

  static Future<void> reviewPayment(String id, String status, String note) async {
    final headers = await _headers();
    final res = await http.patch(
      Uri.parse('$baseUrl/api/admin/payments/$id'),
      headers: headers,
      body: jsonEncode({'status': status, 'review_note': note}),
    );
    await _handleResponse(res);
  }

  static Future<List<dynamic>> getAdminClaims() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/admin/claims'), headers: headers);
    final data = await _handleResponse(res);
    return data['claims'] ?? [];
  }

  static Future<void> reviewClaim(String id, String status, double amount, String note) async {
    final headers = await _headers();
    final res = await http.patch(
      Uri.parse('$baseUrl/api/admin/claims/$id'),
      headers: headers,
      body: jsonEncode({'status': status, 'amount': amount, 'review_note': note}),
    );
    await _handleResponse(res);
  }

  static Future<void> postDues(String title, double amount, String dueDate, String description) async {
    final headers = await _headers();
    final res = await http.post(
      Uri.parse('$baseUrl/api/admin/dues'),
      headers: headers,
      body: jsonEncode({
        'title': title,
        'amount': amount,
        'due_date': dueDate,
        'description': description,
      }),
    );
    await _handleResponse(res);
  }

  static Future<void> toggleDue(String id) async {
    final headers = await _headers();
    final res = await http.patch(Uri.parse('$baseUrl/api/admin/dues/$id/toggle'), headers: headers);
    await _handleResponse(res);
  }

  static Future<List<dynamic>> getNotifications() async {
    final headers = await _headers();
    final res = await http.get(Uri.parse('$baseUrl/api/notifications'), headers: headers);
    final data = await _handleResponse(res);
    return data['notifications'] ?? [];
  }

  static Future<void> markNotificationRead(String id) async {
    final headers = await _headers();
    await http.patch(Uri.parse('$baseUrl/api/notifications/$id/read'), headers: headers);
  }
}
