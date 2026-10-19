import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_service.dart';
import '../theme.dart';

class AdminPortalScreen extends StatefulWidget {
  final VoidCallback onLogout;
  const AdminPortalScreen({super.key, required this.onLogout});

  @override
  State<AdminPortalScreen> createState() => _AdminPortalScreenState();
}

class _AdminPortalScreenState extends State<AdminPortalScreen> {
  int _currentIndex = 0;
  bool _loading = true;

  Map<String, dynamic>? _overviewData;
  List<dynamic> _registrations = [];
  List<dynamic> _members = [];
  List<dynamic> _payments = [];
  List<dynamic> _claims = [];

  final _currencyFormat = NumberFormat.currency(locale: 'en_PH', symbol: '₱');

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() => _loading = true);
    try {
      final ov = await ApiService.getAdminOverview();
      final reg = await ApiService.getRegistrations();
      final mem = await ApiService.getAdminMembers();
      final pay = await ApiService.getAdminPayments();
      final clm = await ApiService.getAdminClaims();

      if (mounted) {
        setState(() {
          _overviewData = ov;
          _registrations = reg;
          _members = mem;
          _payments = pay;
          _claims = clm;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading admin data: $e')));
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
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Admin Portal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Kaagapay Dayong Chapter', style: TextStyle(fontSize: 11, color: AppColors.brand200)),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _loadAllData, tooltip: 'Refresh'),
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
                  _buildOverviewTab(),
                  _buildRegistrationsTab(),
                  _buildMembersTab(),
                  _buildPaymentsTab(),
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
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.pie_chart_rounded), label: 'Overview'),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: _registrations.isNotEmpty,
              label: Text('${_registrations.length}'),
              child: const Icon(Icons.how_to_reg_rounded),
            ),
            label: 'Signups',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.people_rounded), label: 'Members'),
          const BottomNavigationBarItem(icon: Icon(Icons.verified_rounded), label: 'Payments'),
          const BottomNavigationBarItem(icon: Icon(Icons.medical_services_rounded), label: 'Claims'),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 1: OVERVIEW
  // -------------------------------------------------------------
  Widget _buildOverviewTab() {
    final kpis = _overviewData?['kpis'] ?? {};
    final dues = (_overviewData?['dues'] as List?) ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 4 KPI Cards
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.4,
          children: [
            _buildKpiCard('Active members', '${kpis['activeMembers'] ?? 0}', Icons.people_alt_rounded, AppColors.info),
            _buildKpiCard(
              'Reserve fund',
              _currencyFormat.format((kpis['reserveFund'] as num?)?.toDouble() ?? 0.0),
              Icons.savings_rounded,
              AppColors.success,
            ),
            _buildKpiCard(
              'Benefits paid',
              _currencyFormat.format((kpis['payoutsSum'] as num?)?.toDouble() ?? 0.0),
              Icons.medical_services_rounded,
              const Color(0xFF8B5CF6),
            ),
            _buildKpiCard('Pending signups', '${kpis['pendingUsers'] ?? 0}', Icons.person_add_alt_1_rounded, AppColors.warning),
          ],
        ),
        const SizedBox(height: 16),

        // Action: Post New Dues
        ElevatedButton.icon(
          onPressed: _openPostDuesSheet,
          icon: const Icon(Icons.campaign_rounded, size: 20),
          label: const Text('Post New Community Dues'),
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
        ),
        const SizedBox(height: 16),

        // Posted Dues List
        const Text('Posted Chapter Dues', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        if (dues.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Center(child: Text('No dues posted yet.', style: TextStyle(color: AppColors.textSub))),
            ),
          )
        else
          ...dues.map((d) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  title: Text(d['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  subtitle: Text('Due: ${_formatDate(d['due_date'])} • Paid: ${d['paid_count'] ?? 0}/${d['total_audience'] ?? 0}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_currencyFormat.format((d['amount'] as num?)?.toDouble() ?? 0.0), style: const TextStyle(fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: Icon(
                          d['status'] == 'Open' ? Icons.lock_outline_rounded : Icons.lock_open_rounded,
                          size: 18,
                        ),
                        onPressed: () async {
                          await ApiService.toggleDue(d['id']);
                          _loadAllData();
                        },
                      ),
                    ],
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSub)),
                Icon(icon, color: color, size: 18),
              ],
            ),
            Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.ink900)),
          ],
        ),
      ),
    );
  }

  void _openPostDuesSheet() {
    final titleController = TextEditingController();
    final amountController = TextEditingController(text: '50.00');
    final descController = TextEditingController();
    String dueDate = DateFormat('yyyy-MM-dd').format(DateTime.now().add(const Duration(days: 14)));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
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
              const Text('Post New Chapter Dues', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Title *', hintText: 'Death Contribution #2026-008')),
              const SizedBox(height: 10),
              TextField(controller: amountController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount per member (₱) *')),
              const SizedBox(height: 10),
              TextField(
                controller: TextEditingController(text: dueDate),
                decoration: const InputDecoration(labelText: 'Due Date (YYYY-MM-DD) *'),
                onChanged: (v) => dueDate = v,
              ),
              const SizedBox(height: 10),
              TextField(controller: descController, decoration: const InputDecoration(labelText: 'Particulars *', hintText: 'Late Juan Dela Cruz — Brgy. Visayan')),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  final title = titleController.text.trim();
                  final amt = double.tryParse(amountController.text) ?? 0.0;
                  final desc = descController.text.trim();
                  if (title.isEmpty || amt <= 0 || desc.isEmpty) return;

                  try {
                    await ApiService.postDues(title, amt, dueDate, desc);
                    if (ctx.mounted) Navigator.pop(ctx);
                    _loadAllData();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Dues published!')));
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                    }
                  }
                },
                child: const Text('Publish Dues'),
              ),
            ],
          ),
        );
      },
    );
  }

  // -------------------------------------------------------------
  // TAB 2: REGISTRATIONS
  // -------------------------------------------------------------
  Widget _buildRegistrationsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Pending Member Approvals (${_registrations.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        if (_registrations.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No registrations waiting for approval.', style: TextStyle(color: AppColors.textSub))),
            ),
          )
        else
          ..._registrations.map((m) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      Text('${m['email']} • ${m['phone']}', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
                      Text('Location: ${m['barangay']}, ${m['municipality']}', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            onPressed: () async {
                              await ApiService.updateUserStatus(m['id'], 'Rejected');
                              _loadAllData();
                            },
                            child: const Text('Reject', style: TextStyle(color: AppColors.danger)),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () async {
                              await ApiService.updateUserStatus(m['id'], 'Active');
                              _loadAllData();
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${m['name']} approved!')));
                              }
                            },
                            child: const Text('Approve'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
      ],
    );
  }

  // -------------------------------------------------------------
  // TAB 3: MEMBERS
  // -------------------------------------------------------------
  Widget _buildMembersTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Chapter Registry (${_members.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        ..._members.map((m) {
          final isActive = m['status'] == 'Active';
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: isActive ? AppColors.brand100 : const Color(0xFFFEE2E2),
                child: Text(
                  m['name'] != null && m['name'].toString().isNotEmpty ? m['name'][0] : 'M',
                  style: TextStyle(color: isActive ? AppColors.brand800 : AppColors.danger, fontWeight: FontWeight.bold),
                ),
              ),
              title: Text(m['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('${m['id']} • ${m['barangay']}'),
              trailing: PopupMenuButton<String>(
                onSelected: (val) async {
                  await ApiService.updateUserStatus(m['id'], val);
                  _loadAllData();
                },
                itemBuilder: (ctx) => [
                  if (!isActive) const PopupMenuItem(value: 'Active', child: Text('Activate / Approve')),
                  if (isActive) const PopupMenuItem(value: 'Suspended', child: Text('Suspend Account')),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }

  // -------------------------------------------------------------
  // TAB 4: PAYMENTS VERIFICATION
  // -------------------------------------------------------------
  Widget _buildPaymentsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Payments for Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        if (_payments.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No payments recorded.', style: TextStyle(color: AppColors.textSub))),
            ),
          )
        else
          ..._payments.map((p) {
            final isPending = p['status'] == 'Pending';
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
                        Text('Ref: ${p['ref_no']}', style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
                        Text(_currencyFormat.format((p['amount'] as num?)?.toDouble() ?? 0.0), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('Member: ${p['member_name']} • For: ${p['due_title'] ?? 'General'}', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
                    Text('Method: ${p['method']} • ${_formatDate(p['payment_date'])}', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
                    const SizedBox(height: 10),
                    if (isPending)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            onPressed: () async {
                              await ApiService.reviewPayment(p['id'], 'Rejected', 'Reference details do not match');
                              _loadAllData();
                            },
                            child: const Text('Reject', style: TextStyle(color: AppColors.danger)),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () async {
                              await ApiService.reviewPayment(p['id'], 'Approved', '');
                              _loadAllData();
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment approved!')));
                              }
                            },
                            child: const Text('Approve'),
                          ),
                        ],
                      )
                    else
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          p['status'].toString().toUpperCase(),
                          style: TextStyle(
                            color: p['status'] == 'Approved' ? AppColors.brand700 : AppColors.danger,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  // -------------------------------------------------------------
  // TAB 5: CLAIMS VERIFICATION
  // -------------------------------------------------------------
  Widget _buildClaimsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Benefit Claims for Adjudication', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        if (_claims.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No claims filed.', style: TextStyle(color: AppColors.textSub))),
            ),
          )
        else
          ..._claims.map((c) {
            final isPending = c['status'] == 'Pending Review';
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
                        Text(_currencyFormat.format((c['amount'] as num?)?.toDouble() ?? 0.0), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.brand700)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('Deceased: ${c['deceased_name']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text('Claimant: ${c['member_name']} • Date: ${_formatDate(c['date_of_death'])}', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
                    Text('Cause: ${c['cause']}', style: const TextStyle(fontSize: 12, color: AppColors.textSub)),
                    const SizedBox(height: 10),
                    if (isPending)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          OutlinedButton(
                            onPressed: () async {
                              await ApiService.reviewClaim(c['id'], 'Rejected', 0, 'Incomplete documentation');
                              _loadAllData();
                            },
                            child: const Text('Reject', style: TextStyle(color: AppColors.danger)),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () async {
                              await ApiService.reviewClaim(c['id'], 'Approved', (c['amount'] as num).toDouble(), '');
                              _loadAllData();
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Claim approved!')));
                              }
                            },
                            child: const Text('Approve Claim'),
                          ),
                        ],
                      )
                    else
                      Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          c['status'].toString().toUpperCase(),
                          style: TextStyle(
                            color: c['status'] == 'Approved' ? AppColors.brand700 : AppColors.danger,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}
