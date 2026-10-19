import 'package:flutter/material.dart';
import 'api_service.dart';
import 'theme.dart';
import 'screens/auth_screen.dart';
import 'screens/member_portal_screen.dart';
import 'screens/admin_portal_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const KaagapayApp());
}

class KaagapayApp extends StatefulWidget {
  const KaagapayApp({super.key});

  @override
  State<KaagapayApp> createState() => _KaagapayAppState();
}

class _KaagapayAppState extends State<KaagapayApp> {
  bool _loading = true;
  Map<String, dynamic>? _currentUser;

  @override
  void initState() {
    super.initState();
    _checkCurrentUser();
  }

  Future<void> _checkCurrentUser() async {
    setState(() => _loading = true);
    try {
      final token = await ApiService.getToken();
      if (token != null) {
        final res = await ApiService.getMe();
        setState(() {
          _currentUser = res['user'];
        });
      } else {
        setState(() => _currentUser = null);
      }
    } catch (_) {
      await ApiService.logout();
      setState(() => _currentUser = null);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kaagapay Dayong',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: _loading
          ? const Scaffold(
              backgroundColor: AppColors.ink900,
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppColors.brand400),
                    SizedBox(height: 16),
                    Text(
                      'Kaagapay Dayong',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
              ),
            )
          : _currentUser == null
              ? AuthScreen(onLoginSuccess: _checkCurrentUser)
              : _currentUser!['role'] == 'admin'
                  ? AdminPortalScreen(onLogout: _checkCurrentUser)
                  : MemberPortalScreen(onLogout: _checkCurrentUser),
    );
  }
}
