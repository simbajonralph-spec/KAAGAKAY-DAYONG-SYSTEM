import 'package:flutter/material.dart';
import '../api_service.dart';
import '../theme.dart';

class AuthScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  const AuthScreen({super.key, required this.onLoginSuccess});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _obscurePassword = true;
  bool _loading = false;
  String? _errorMessage;

  // Login controllers
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();

  // Signup controllers
  final _signupNameController = TextEditingController();
  final _signupEmailController = TextEditingController();
  final _signupPhoneController = TextEditingController();
  final _signupPasswordController = TextEditingController();
  final _signupPassword2Controller = TextEditingController();
  final _signupBarangayController = TextEditingController();
  String? _selectedMunicipality;

  final List<String> _davaoMunicipalities = [
    'Tagum City', 'Panabo City', 'Davao City', 'Digos City', 'Mati City',
    'Island Garden City of Samal', 'Carmen', 'Mawab', 'Asuncion',
    'Braulio E. Dujali', 'Kapalong', 'New Corella', 'Santo Tomas',
    'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay', 'Malalag', 'Matanao',
    'Santa Cruz', 'Compostela', 'Laak', 'Mabini', 'Maco', 'Monkayo',
    'Nabunturan', 'Pantukan', 'Malita', 'Santa Maria', 'Lupon', 'Baganga'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _signupNameController.dispose();
    _signupEmailController.dispose();
    _signupPhoneController.dispose();
    _signupPasswordController.dispose();
    _signupPassword2Controller.dispose();
    _signupBarangayController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() {
      _errorMessage = null;
      _loading = true;
    });

    final email = _loginEmailController.text.trim();
    final password = _loginPasswordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Enter your email address and password.';
        _loading = false;
      });
      return;
    }

    try {
      await ApiService.login(email, password);
      widget.onLoginSuccess();
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleSignup() async {
    setState(() {
      _errorMessage = null;
      _loading = true;
    });

    final name = _signupNameController.text.trim();
    final email = _signupEmailController.text.trim();
    final phone = _signupPhoneController.text.trim();
    final pw = _signupPasswordController.text;
    final pw2 = _signupPassword2Controller.text;
    final mun = _selectedMunicipality;
    final brgy = _signupBarangayController.text.trim();

    if (name.length < 3) {
      setState(() { _errorMessage = 'Enter your full name.'; _loading = false; });
      return;
    }
    if (!email.contains('@')) {
      setState(() { _errorMessage = 'Enter a valid email address.'; _loading = false; });
      return;
    }
    if (pw.length < 8) {
      setState(() { _errorMessage = 'Password must have at least 8 characters.'; _loading = false; });
      return;
    }
    if (pw != pw2) {
      setState(() { _errorMessage = 'Passwords do not match.'; _loading = false; });
      return;
    }
    if (mun == null) {
      setState(() { _errorMessage = 'Select your municipality or city.'; _loading = false; });
      return;
    }
    if (brgy.length < 2) {
      setState(() { _errorMessage = 'Enter your barangay or purok.'; _loading = false; });
      return;
    }

    try {
      final res = await ApiService.register(
        name: name,
        email: email,
        phone: phone,
        password: pw,
        municipality: mun,
        barangay: brgy,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(res['message'] ?? 'Registration submitted!')),
        );
        _tabController.animateTo(0);
        _loginEmailController.text = email;
        _loginPasswordController.clear();
      }
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _fillDemo(String email, String pw) {
    _loginEmailController.text = email;
    _loginPasswordController.text = pw;
    setState(() => _errorMessage = null);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ink900,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              clipBehavior: Clip.antiAlias,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 480),
                color: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Header
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.brand700,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.volunteer_activism_rounded, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 12),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Kaagapay Dayong',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.ink900),
                            ),
                            Text(
                              'Mutual aid & funeral assistance',
                              style: TextStyle(fontSize: 12, color: AppColors.textSub),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Tab Selector
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        indicatorSize: TabBarIndicatorSize.tab,
                        indicator: BoxDecoration(
                          color: AppColors.brand700,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        labelColor: Colors.white,
                        unselectedLabelColor: AppColors.textSub,
                        tabs: const [
                          Tab(text: 'Sign in'),
                          Tab(text: 'Create account'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Error Alert
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFFECACA)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Tab Views
                    SizedBox(
                      height: 400,
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildLoginForm(),
                          _buildSignupForm(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _loginEmailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              labelText: 'Email address',
              prefixIcon: Icon(Icons.email_outlined, size: 20),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _loginPasswordController,
            obscureText: _obscurePassword,
            decoration: InputDecoration(
              labelText: 'Password',
              prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  size: 20,
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loading ? null : _handleLogin,
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Sign in'),
          ),
          const SizedBox(height: 16),

          // Demo accounts container
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.brand50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.brand200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Quick Demo Accounts',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.brand900),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _fillDemo('tagumcity@gmail.com', 'admin123'),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        child: const Text('Chapter Admin', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _fillDemo('juan.delacruz@email.com', 'member123'),
                        style: OutlinedButton.styleFrom(
                          backgroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                        ),
                        child: const Text('Member', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignupForm() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _signupNameController,
            decoration: const InputDecoration(labelText: 'Full name *'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _signupEmailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email address *'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _signupPhoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Mobile number *', hintText: '0917-000-0000'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _signupPasswordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password *', hintText: 'Min. 8 characters'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _signupPassword2Controller,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Confirm password *'),
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            initialValue: _selectedMunicipality,
            decoration: const InputDecoration(labelText: 'Municipality / City *'),
            items: _davaoMunicipalities
                .map((m) => DropdownMenuItem(value: m, child: Text(m, style: const TextStyle(fontSize: 14))))
                .toList(),
            onChanged: (val) => setState(() => _selectedMunicipality = val),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _signupBarangayController,
            decoration: const InputDecoration(labelText: 'Barangay / Purok *'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loading ? null : _handleSignup,
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Submit registration'),
          ),
        ],
      ),
    );
  }
}
