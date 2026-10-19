import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../api_service.dart';
import '../theme.dart';

class MemberPortalScreen extends StatefulWidget {
  final VoidCallback onLogout;
  const MemberPortalScreen({super.key, required this.onLogout});

  @override
  State<MemberPortalScreen> createState() => _MemberPortalScreenState();
}

class _MemberPortalScreenState extends State<MemberPortalScreen> {
  int _currentIndex = 0;
  bool _loading = true;

  Map<String, dynamic>? _dashboardData;
  List<dynamic> _beneficiaries = [];
  List<dynamic> _payments = [];
  List<dynamic> _claims = [];
  List<dynamic> _benefitTypes = [];

  final _currencyFormat = NumberFormat.currency(locale: 'en_PH', symbol: '₱');

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() => _loading = true);
    try {
      final dash = await ApiService.getMemberDashboard();
      final ben = await ApiService.getBeneficiaries();
      final pays = await ApiService.getMemberPayments();
      final clms = await ApiService.getMemberClaims();
      final bnfs = await ApiService.getBenefitTypes();

      if (mounted) {
        setState(() {
          _dashboardData = dash;
          _beneficiaries = ben;
          _payments = pays;
          _claims = clms;
          _benefitTypes = bnfs;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return '—';
    try {
      final d = DateTime.parse(date.toString());
      return DateFormat('MMM dd, yyyy').format(d);
    } catch (_) {
      return date.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _dashboardData?['user'] ?? {};

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.volunteer_activism_rounded, color: AppColors.brand400, size: 22),
            const SizedBox(width: 8),
            Text(user['name'] ?? 'Kaagapay Dayong', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadAllData,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await ApiService.logout();
              widget.onLogout();
            },
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.brand700))
          : RefreshIndicator(
              onRefresh: _loadAllData,
              child: IndexedStack(
                index: _currentIndex,
                children: [
                  _buildDashboardTab(),
                  _buildPaymentsTab(),
                  _buildProfileTab(),
                  _buildClaimsTab(),
                ],
              ),
            ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        selectedItemColor: AppColors.brand700,
        unselectedItemColor: AppColors.textSub,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded), label: 'Payments'),
          BottomNavigationBarItem(icon: Icon(Icons.person_pin_rounded), label: 'Profile'),
          BottomNavigationBarItem(icon: Icon(Icons.volunteer_activism_rounded), label: 'Claims'),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 1: DASHBOARD
  // -------------------------------------------------------------
  Widget _buildDashboardTab() {
    final user = _dashboardData?['user'] ?? {};
    final summary = _dashboardData?['summary'] ?? {};
    final dues = (_dashboardData?['dues'] as List?) ?? [];
    final standing = summary['standing'] ?? 'good';
    final totalDue = (summary['totalDue'] as num?)?.toDouble() ?? 0.0;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Welcome Card
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: BorderSide(
              color: standing == 'overdue'
                  ? AppColors.danger
                  : standing == 'dueSoon'
                      ? AppColors.warning
                      : AppColors.brand600,
              width: 2,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome back, ${user['name']?.toString().split(' ')[0] ?? 'Member'}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.ink900),
                ),
                Text(
                  '${user['barangay'] ?? ''}, ${user['municipality'] ?? ''}',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSub),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Amount due', style: TextStyle(fontSize: 12, color: AppColors.textSub)),
                        Text(
                          _currencyFormat.format(totalDue),
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.ink900),
                        ),
                      ],
                    ),
                    _buildStandingBadge(standing),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Digital Membership ID Card
        _buildDigitalIdCard(user),
        const SizedBox(height: 16),

        // 3 Mini KPIs
        Row(
          children: [
            Expanded(
              child: _buildMiniKpi(
                'Membership',
                user['status'] ?? 'Active',
                Icons.check_circle_outline_rounded,
                AppColors.brand700,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildMiniKpi(
                'Beneficiaries',
                '${summary['beneficiaryCount'] ?? 0} of 5',
                Icons.people_outline_rounded,
                AppColors.info,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildMiniKpi(
                'Unpaid dues',
                '${summary['unpaidCount'] ?? 0}',
                Icons.receipt_outlined,
                AppColors.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Community Dues Section
        const Text(
          'Community Dues for your Chapter',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.ink900),
        ),
        const SizedBox(height: 8),
        if (dues.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text('No community dues for your chapter right now.', style: TextStyle(color: AppColors.textSub)),
              ),
            ),
          )
        else
          ...dues.map((d) => _buildDueCard(d)),
      ],
    );
  }

  Widget _buildStandingBadge(String standing) {
    Color bg = const Color(0xFFD1FAE5);
    Color fg = const Color(0xFF065F46);
    String label = 'Good standing';

    if (standing == 'overdue') {
      bg = const Color(0xFFFEE2E2);
      fg = const Color(0xFF991B1B);
      label = 'Overdue dues';
    } else if (standing == 'dueSoon') {
      bg = const Color(0xFFFEF3C7);
      fg = const Color(0xFF92400E);
      label = 'Dues to pay';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildDigitalIdCard(Map<String, dynamic> user) {
    final id = user['id'] ?? 'KD-2026-088';
    final name = user['name'] ?? 'Member';
    final mun = user['municipality'] ?? 'Tagum City';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.ink900,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4))],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Kaagapay Dayong', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  Text('Official Membership ID', style: TextStyle(color: Colors.white70, fontSize: 11)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.brand500.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.brand400),
                ),
                child: const Text('Verified', style: TextStyle(color: AppColors.brand200, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: AppColors.brand600,
                child: Text(
                  name.isNotEmpty ? name[0] : 'M',
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('ID: $id', style: const TextStyle(color: Colors.white70, fontSize: 12, fontFamily: 'monospace')),
                    Text('$mun chapter', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  ],
                ),
              ),
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(4),
                child: QrImageView(
                  data: 'KD-ID:$id',
                  version: QrVersions.auto,
                  size: 56.0,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(color: Colors.white24, height: 1),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Valid until: Dec 31, ${DateTime.now().year}', style: const TextStyle(color: Colors.white60, fontSize: 11)),
              const Text('Mutual Aid Program', style: TextStyle(color: Colors.white60, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniKpi(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.ink900)),
            Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSub), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildDueCard(Map<String, dynamic> due) {
    final state = due['paymentState'] ?? 'unpaid';
    final amount = (due['amount'] as num?)?.toDouble() ?? 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    due['title'] ?? 'Dues',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.ink900),
                  ),
                ),
                _buildStatusTag(state),
              ],
            ),
            const SizedBox(height: 4),
            Text(due['description'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_currencyFormat.format(amount), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text('Due ${_formatDate(due['due_date'])}', style: const TextStyle(fontSize: 11, color: AppColors.textSub)),
                  ],
                ),
                if (state == 'unpaid' || state == 'overdue')
                  ElevatedButton(
                    onPressed: () => _openPaymentDialog(due),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6)),
                    child: const Text('Pay now', style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusTag(String status) {
    Color bg = const Color(0xFFF1F5F9);
    Color fg = const Color(0xFF475569);

    if (status == 'paid' || status == 'Approved' || status == 'Active') {
      bg = const Color(0xFFD1FAE5); fg = const Color(0xFF065F46);
    } else if (status == 'Pending' || status == 'review' || status == 'Pending Review') {
      bg = const Color(0xFFFEF3C7); fg = const Color(0xFF92400E);
    } else if (status == 'overdue' || status == 'Rejected') {
      bg = const Color(0xFFFEE2E2); fg = const Color(0xFF991B1B);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(status.toUpperCase(), style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }

  // -------------------------------------------------------------
  // TAB 2: PAYMENTS & DUES
  // -------------------------------------------------------------
  Widget _buildPaymentsTab() {
    final chapter = _dashboardData?['chapter'] ?? {};

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Channels Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Chapter Payment Channels', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                _buildChannelItem('GCash', chapter['gcashAcc'] ?? '—', chapter['gcashNum'] ?? '—', AppColors.info),
                const SizedBox(height: 8),
                _buildChannelItem('Bank (Landbank)', chapter['bankAcc'] ?? '—', chapter['bankNum'] ?? '—', AppColors.brand700),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Payment History', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ElevatedButton.icon(
              onPressed: () => _openPaymentDialog(null),
              icon: const Icon(Icons.add_rounded, size: 16),
              label: const Text('Submit proof', style: TextStyle(fontSize: 12)),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_payments.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No payments recorded yet.', style: TextStyle(color: AppColors.textSub))),
            ),
          )
        else
          ..._payments.map((p) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(p['due_title'] ?? 'General contribution', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: Text('Ref: ${p['ref_no']} • ${_formatDate(p['payment_date'])}', style: const TextStyle(fontSize: 11)),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(_currencyFormat.format((p['amount'] as num?)?.toDouble() ?? 0.0), style: const TextStyle(fontWeight: FontWeight.bold)),
                      _buildStatusTag(p['status'] ?? 'Pending'),
                    ],
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildChannelItem(String method, String name, String num, Color color) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(method, style: TextStyle(fontWeight: FontWeight.bold, color: color, fontSize: 12)),
              Text('$name • $num', style: const TextStyle(fontSize: 12)),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.copy_rounded, size: 18),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: num));
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied to clipboard!')));
            },
          ),
        ],
      ),
    );
  }

  void _openPaymentDialog(Map<String, dynamic>? initialDue) {
    final refController = TextEditingController();
    final amountController = TextEditingController(text: initialDue != null ? initialDue['amount'].toString() : '50');
    String method = 'GCash';
    String dueId = initialDue != null ? initialDue['id'] : 'GENERAL';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Submit Payment for Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: method,
                    decoration: const InputDecoration(labelText: 'Channel'),
                    items: const [
                      DropdownMenuItem(value: 'GCash', child: Text('GCash')),
                      DropdownMenuItem(value: 'Bank Transfer', child: Text('Bank Transfer (Landbank)')),
                      DropdownMenuItem(value: 'Office Cash Counter', child: Text('Office Cash Counter')),
                    ],
                    onChanged: (val) => setModalState(() => method = val ?? 'GCash'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: refController,
                    decoration: const InputDecoration(labelText: 'Reference Number *', hintText: 'e.g. 10029384728'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: amountController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Amount Paid (₱) *'),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      final ref = refController.text.trim();
                      final amt = double.tryParse(amountController.text) ?? 0.0;
                      if (ref.isEmpty || amt <= 0) return;

                      try {
                        await ApiService.submitPayment(
                          dueId: dueId,
                          method: method,
                          refNo: ref,
                          amount: amt,
                          date: DateFormat('yyyy-MM-dd').format(DateTime.now()),
                        );
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Payment submitted!')));
                          Navigator.pop(ctx);
                        }
                        _loadAllData();
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e')));
                        }
                      }
                    },
                    child: const Text('Submit Payment'),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // -------------------------------------------------------------
  // TAB 3: PROFILE & BENEFICIARIES
  // -------------------------------------------------------------
  Widget _buildProfileTab() {
    final user = _dashboardData?['user'] ?? {};

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Personal Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    _buildStatusTag(user['status'] ?? 'Active'),
                  ],
                ),
                const SizedBox(height: 12),
                _buildProfileRow('Full name', user['name'] ?? '—'),
                _buildProfileRow('Email', user['email'] ?? '—'),
                _buildProfileRow('Phone', user['phone'] ?? '—'),
                _buildProfileRow('Chapter', user['municipality'] ?? '—'),
                _buildProfileRow('Barangay', user['barangay'] ?? '—'),
                _buildProfileRow('Civil status', user['civil_status'] ?? 'Single'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Beneficiaries (${_beneficiaries.length}/5)', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            if (_beneficiaries.length < 5)
              ElevatedButton.icon(
                onPressed: _openAddBeneficiaryDialog,
                icon: const Icon(Icons.add_rounded, size: 16),
                label: const Text('Add', style: TextStyle(fontSize: 12)),
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)),
              ),
          ],
        ),
        const SizedBox(height: 8),

        if (_beneficiaries.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No beneficiaries registered.', style: TextStyle(color: AppColors.textSub))),
            ),
          )
        else
          ..._beneficiaries.map((b) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: const CircleAvatar(
                    backgroundColor: AppColors.brand100,
                    child: Icon(Icons.person_rounded, color: AppColors.brand700),
                  ),
                  title: Text(b['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('${b['relation']} • Born ${_formatDate(b['dob'])}'),
                  trailing: b['is_deceased'] == true
                      ? _buildStatusTag('Deceased')
                      : IconButton(
                          icon: const Icon(Icons.delete_outline_rounded, color: AppColors.danger, size: 20),
                          onPressed: () async {
                            await ApiService.removeBeneficiary(b['id']);
                            _loadAllData();
                          },
                        ),
                ),
              )),
      ],
    );
  }

  Widget _buildProfileRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSub, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  void _openAddBeneficiaryDialog() {
    final nameController = TextEditingController();
    String relation = 'Spouse';
    String dob = DateFormat('yyyy-MM-dd').format(DateTime(1990, 1, 1));

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: const Text('Add Beneficiary'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Full name *')),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                initialValue: relation,
                decoration: const InputDecoration(labelText: 'Relationship'),
                items: const [
                  DropdownMenuItem(value: 'Spouse', child: Text('Spouse')),
                  DropdownMenuItem(value: 'Child', child: Text('Child')),
                  DropdownMenuItem(value: 'Parent', child: Text('Parent')),
                  DropdownMenuItem(value: 'Sibling', child: Text('Sibling')),
                ],
                onChanged: (val) => relation = val ?? 'Spouse',
              ),
              const SizedBox(height: 10),
              TextField(
                decoration: const InputDecoration(labelText: 'Date of Birth (YYYY-MM-DD)'),
                controller: TextEditingController(text: dob),
                onChanged: (val) => dob = val,
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final name = nameController.text.trim();
                if (name.length < 3) return;
                try {
                  await ApiService.addBeneficiary(name, relation, dob);
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                  }
                  _loadAllData();
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );
  }

  // -------------------------------------------------------------
  // TAB 4: BENEFIT CLAIMS
  // -------------------------------------------------------------
  Widget _buildClaimsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Funeral Benefit Claims', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ElevatedButton.icon(
              onPressed: _openFileClaimSheet,
              icon: const Icon(Icons.add_rounded, size: 16),
              label: const Text('File Claim', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_claims.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('You have not filed any benefit claims.', style: TextStyle(color: AppColors.textSub))),
            ),
          )
        else
          ..._claims.map((c) {
            return Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(c['id'] ?? '', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                        _buildStatusTag(c['status'] ?? 'Pending Review'),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(c['deceased_name'] ?? '', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    Text('Date of death: ${_formatDate(c['date_of_death'])} • Cause: ${c['cause']}', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Benefit amount:', style: TextStyle(fontSize: 12, color: AppColors.textSub)),
                        Text(_currencyFormat.format((c['amount'] as num?)?.toDouble() ?? 0.0), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.brand700)),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  void _openFileClaimSheet() {
    final eligible = _beneficiaries.where((b) => b['is_deceased'] != true).toList();
    if (eligible.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No eligible beneficiaries to file a claim for.')));
      return;
    }

    String selectedBenId = eligible.first['id'];
    final causeController = TextEditingController();
    final placeController = TextEditingController();
    List<String> selectedBenefitIds = _benefitTypes.isNotEmpty ? [_benefitTypes.first['id'].toString()] : [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            final total = _benefitTypes
                .where((b) => selectedBenefitIds.contains(b['id'].toString()))
                .fold<double>(0.0, (acc, b) => acc + ((b['amount'] as num?)?.toDouble() ?? 0.0));

            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('File Funeral Benefit Claim', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      initialValue: selectedBenId,
                      decoration: const InputDecoration(labelText: 'Deceased Beneficiary *'),
                      items: eligible
                          .map((b) => DropdownMenuItem(value: b['id'].toString(), child: Text('${b['name']} (${b['relation']})')))
                          .toList(),
                      onChanged: (val) => setSheetState(() => selectedBenId = val ?? selectedBenId),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: causeController,
                      decoration: const InputDecoration(labelText: 'Cause of death *', hintText: 'e.g. Cardiopulmonary arrest'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: placeController,
                      decoration: const InputDecoration(labelText: 'Place of death *', hintText: 'Hospital or residence address'),
                    ),
                    const SizedBox(height: 12),
                    const Text('Benefits Requested', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    ..._benefitTypes.map((b) {
                      final id = b['id'].toString();
                      final isChecked = selectedBenefitIds.contains(id);
                      final amt = (b['amount'] as num?)?.toDouble() ?? 0.0;
                      return CheckboxListTile(
                        dense: true,
                        title: Text(b['name'] ?? ''),
                        subtitle: Text(_currencyFormat.format(amt)),
                        value: isChecked,
                        onChanged: (val) {
                          setSheetState(() {
                            if (val == true) {
                              selectedBenefitIds.add(id);
                            } else {
                              selectedBenefitIds.remove(id);
                            }
                          });
                        },
                      );
                    }),
                    const SizedBox(height: 8),
                    Text('Total Estimated: ${_currencyFormat.format(total)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.brand700)),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () async {
                        final cause = causeController.text.trim();
                        final place = placeController.text.trim();
                        if (cause.isEmpty || place.isEmpty || selectedBenefitIds.isEmpty) return;

                        try {
                          await ApiService.submitClaim(
                            beneficiaryId: selectedBenId,
                            dateOfDeath: DateFormat('yyyy-MM-dd').format(DateTime.now()),
                            cause: cause,
                            place: place,
                            benefitIds: selectedBenefitIds,
                            deathCertBase64: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect fill="%23216b45" width="300" height="200"/><text fill="%23fff" x="50%" y="50%" text-anchor="middle">Death Certificate</text></svg>',
                          );
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(const SnackBar(content: Text('Claim submitted for review!')));
                            Navigator.pop(ctx);
                          }
                          _loadAllData();
                        } catch (e) {
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e')));
                          }
                        }
                      },
                      child: const Text('Submit Claim'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
