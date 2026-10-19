const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Pool } = require('pg');
require('dotenv').config();

const { verifyToken, requireAdmin, requireActiveMemberOrAdmin, JWT_SECRET } = require('./authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads folder
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Database Connection Pool
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'kaagapay_dayong'
    });

// ID Generator Helper
async function getNextId(kind, prefix = null) {
  const res = await pool.query(
    `INSERT INTO counters (kind, seq_value)
     VALUES ($1, 1)
     ON CONFLICT (kind)
     DO UPDATE SET seq_value = counters.seq_value + 1
     RETURNING seq_value`,
    [kind]
  );
  const seq = res.rows[0].seq_value;
  const pad = (n, w = 3) => String(n).padStart(w, '0');

  switch (kind) {
    case 'member':
      return `KD-2026-${pad(seq)}`;
    case 'due':
      return `DUE-2026-${pad(seq)}`;
    case 'payment':
      return `PAY-${pad(seq, 4)}`;
    case 'claim':
      return `CLM-2026-${pad(seq)}`;
    case 'benefit':
      return `BNF-${pad(seq, 3)}`;
    case 'notif':
      return `NOTIF-${pad(seq, 3)}`;
    default:
      return `${prefix || kind}-${seq}`;
  }
}

// Chapter Metadata & Davao Region Locations
const CHAPTER_DATA = {
  'Tagum City': {
    admin: 'Ralph Simbajon',
    adminEmail: 'tagumcity@gmail.com',
    adminAddress: 'Purok 1-B, Magugpo North, Tagum City',
    barangays: ['Purok 1-B, Magugpo North', 'San Vicente', 'Visayan', 'Central', 'Apokon'],
    gcashAcc: 'Admin Ralph Simbajon',
    gcashNum: '0917-888-9999',
    bankAcc: 'Kaagapay Dayong Tagum',
    bankNum: '1234-5678-9012'
  },
  'Carmen': {
    admin: 'Maria Clara',
    adminEmail: 'carmen@gmail.com',
    adminAddress: 'Barangay Poblacion, Carmen, Davao del Norte',
    barangays: ['Barangay Poblacion', 'Tuganay', 'Alejal', 'Magsaysay'],
    gcashAcc: 'Admin Maria Clara',
    gcashNum: '0918-777-1111',
    bankAcc: 'Kaagapay Dayong Carmen',
    bankNum: '2234-5678-9012'
  },
  'Mawab': {
    admin: 'Juan Santos',
    adminEmail: 'mawab@gmail.com',
    adminAddress: 'Poblacion, Mawab, Davao de Oro',
    barangays: ['Poblacion', 'Bawani', 'Andili', 'Tuboran'],
    gcashAcc: 'Admin Juan Santos',
    gcashNum: '0920-555-2222',
    bankAcc: 'Kaagapay Dayong Mawab',
    bankNum: '3234-5678-9012'
  },
  'Panabo City': {
    admin: 'Grace Poe',
    adminEmail: 'panabo@gmail.com',
    adminAddress: 'Gredu, Panabo City, Davao del Norte',
    barangays: ['Gredu', 'Sto. Niño', 'New Pandan', 'San Francisco'],
    gcashAcc: 'Admin Grace Poe',
    gcashNum: '0922-333-4444',
    bankAcc: 'Kaagapay Dayong Panabo',
    bankNum: '4234-5678-9012'
  },
  'Davao City': {
    admin: 'Carlos Yulo',
    adminEmail: 'davao@gmail.com',
    adminAddress: 'Buhangin, Davao City',
    barangays: ['Poblacion', 'Buhangin', 'Talomo', 'Matina', 'Toril'],
    gcashAcc: 'Admin Carlos Yulo',
    gcashNum: '0919-444-8888',
    bankAcc: 'Kaagapay Dayong Davao',
    bankNum: '5234-5678-9012'
  }
};

const DAVAO_REGION_LOCATIONS = {
  'Davao City (HUC)': ['Davao City'],
  'Davao del Norte': ['Tagum City', 'Panabo City', 'Island Garden City of Samal', 'Asuncion', 'Braulio E. Dujali', 'Carmen', 'Kapalong', 'New Corella', 'San Isidro (Davao del Norte)', 'Santo Tomas', 'Talaingod'],
  'Davao del Sur': ['Digos City', 'Bansalan', 'Hagonoy', 'Kiblawan', 'Magsaysay', 'Malalag', 'Matanao', 'Padada', 'Santa Cruz', 'Sulop'],
  'Davao de Oro': ['Compostela', 'Laak', 'Mabini', 'Maco', 'Maragusan', 'Mawab', 'Monkayo', 'Montevista', 'Nabunturan', 'New Bataan', 'Pantukan'],
  'Davao Occidental': ['Don Marcelino', 'Jose Abad Santos', 'Malita', 'Santa Maria', 'Sarangani'],
  'Davao Oriental': ['Mati City', 'Baganga', 'Banaybanay', 'Boston', 'Caraga', 'Cateel', 'Governor Generoso', 'Lupon', 'Manay', 'San Isidro (Davao Oriental)', 'Tarragona']
};

// Notification Dispatcher
async function createNotification({ toUser = null, toChapter = null, title, message }) {
  try {
    const id = await getNextId('notif');
    await pool.query(
      `INSERT INTO notifications (id, to_user, to_chapter, title, message, read_by)
       VALUES ($1, $2, $3, $4, $5, '[]'::jsonb)`,
      [id, toUser, toChapter, title, message]
    );
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
}

// -------------------------------------------------------------
// PUBLIC REFERENCE DATA
// -------------------------------------------------------------
app.get('/api/chapters', (req, res) => {
  res.json({ success: true, chapters: CHAPTER_DATA });
});

app.get('/api/locations', (req, res) => {
  res.json({ success: true, locations: DAVAO_REGION_LOCATIONS });
});

// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`,
      [email.trim()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ success: false, error: 'The email or password is incorrect.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'The email or password is incorrect.' });
    }

    if (user.role === 'member') {
      if (user.status === 'Pending') {
        return res.status(403).json({ success: false, error: 'Your registration is still waiting for approval from your chapter admin.' });
      }
      if (user.status === 'Rejected') {
        return res.status(403).json({ success: false, error: 'Your registration was not approved. Please contact your chapter admin.' });
      }
      if (user.status === 'Suspended') {
        return res.status(403).json({ success: false, error: 'Your account is suspended. Please contact your chapter admin.' });
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        municipality: user.municipality,
        status: user.status
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      municipality: user.municipality,
      barangay: user.barangay,
      civil_status: user.civil_status,
      status: user.status,
      reg_date: user.reg_date
    };

    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, municipality, barangay } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Enter your full name.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
    }
    if (!phone || !/^(\+?63|0)9\d{2}[-\s]?\d{3}[-\s]?\d{4}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, error: 'Enter a valid Philippine mobile number (e.g. 0917-123-4567).' });
    }
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must have at least 8 characters, including a letter and a number.' });
    }
    if (!municipality) {
      return res.status(400).json({ success: false, error: 'Select your municipality or city.' });
    }
    if (!barangay || barangay.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Enter your barangay or purok.' });
    }

    const check = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (check.rowCount > 0) {
      return res.status(400).json({ success: false, error: 'That email address is already registered.' });
    }

    const id = await getNextId('member');
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (id, role, name, email, password_hash, phone, municipality, barangay, civil_status, status, reg_date)
       VALUES ($1, 'member', $2, $3, $4, $5, $6, $7, 'Single', 'Pending', CURRENT_DATE)`,
      [id, name.trim(), email.trim().toLowerCase(), password_hash, phone.trim(), municipality, barangay.trim()]
    );

    // Notify chapter admin
    await createNotification({
      toChapter: municipality,
      title: 'New registration',
      message: `${name.trim()} (${barangay.trim()}) is waiting for approval.`
    });

    res.json({
      success: true,
      message: 'Registration submitted. You can sign in once your chapter admin approves it.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Server error during registration.' });
  }
});

app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, role, name, email, phone, municipality, barangay, civil_status, status, reg_date
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/reset-demo', async (req, res) => {
  try {
    const setupDatabase = require('./setup-database');
    await setupDatabase();
    res.json({ success: true, message: 'All demo data has been reset to original state.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ success: false, error: 'Could not reset demo data.' });
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
app.get('/api/notifications', verifyToken, async (req, res) => {
  try {
    const { id, role, municipality } = req.user;
    let query, params;

    if (role === 'admin') {
      if (municipality === 'All') {
        query = `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`;
        params = [];
      } else {
        query = `SELECT * FROM notifications
                 WHERE to_user = $1 OR to_chapter = $2 OR to_chapter = 'All'
                 ORDER BY created_at DESC LIMIT 50`;
        params = [id, municipality];
      }
    } else {
      query = `SELECT * FROM notifications WHERE to_user = $1 ORDER BY created_at DESC LIMIT 50`;
      params = [id];
    }

    const result = await pool.query(query, params);
    res.json({ success: true, notifications: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await pool.query(
      `UPDATE notifications
       SET read_by = (CASE
         WHEN read_by @> jsonb_build_array($1::text) THEN read_by
         ELSE read_by || jsonb_build_array($1::text)
       END)
       WHERE id = $2`,
      [userId, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/notifications/read-all', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      `UPDATE notifications
       SET read_by = (CASE
         WHEN read_by @> jsonb_build_array($1::text) THEN read_by
         ELSE read_by || jsonb_build_array($1::text)
       END)`,
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// MEMBER ENDPOINTS
// -------------------------------------------------------------
app.get('/api/member/dashboard', verifyToken, requireActiveMemberOrAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRes = await pool.query(
      `SELECT id, role, name, email, phone, municipality, barangay, civil_status, status, reg_date
       FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows[0];

    // Open dues for user chapter
    const duesRes = await pool.query(
      `SELECT d.*,
              EXISTS (SELECT 1 FROM payments p WHERE p.member_id = $1 AND p.due_id = d.id AND p.status = 'Approved') as is_paid,
              EXISTS (SELECT 1 FROM payments p WHERE p.member_id = $1 AND p.due_id = d.id AND p.status = 'Pending') as is_review
       FROM dues d
       WHERE d.status = 'Open' AND (d.municipality = $2 OR d.municipality = 'All')
       ORDER BY d.due_date ASC`,
      [userId, user.municipality]
    );

    const dues = duesRes.rows.map(d => {
      let state = 'unpaid';
      if (d.is_paid) state = 'paid';
      else if (d.is_review) state = 'review';
      else if (new Date(d.due_date) < new Date(new Date().toDateString())) state = 'overdue';
      return { ...d, paymentState: state };
    });

    const unpaid = dues.filter(d => d.paymentState === 'unpaid' || d.paymentState === 'overdue');
    const overdue = dues.filter(d => d.paymentState === 'overdue');
    const totalDue = unpaid.reduce((acc, d) => acc + parseFloat(d.amount), 0);
    const nextDue = unpaid.filter(d => d.paymentState !== 'overdue')[0] || null;

    // Beneficiaries count
    const benRes = await pool.query(
      `SELECT COUNT(*) FROM beneficiaries WHERE member_id = $1`,
      [userId]
    );
    const beneficiaryCount = parseInt(benRes.rows[0].count, 10);

    res.json({
      success: true,
      user,
      chapter: CHAPTER_DATA[user.municipality] || null,
      summary: {
        totalDue,
        unpaidCount: unpaid.length,
        overdueCount: overdue.length,
        nextDueDate: nextDue ? nextDue.due_date : null,
        beneficiaryCount,
        standing: overdue.length > 0 ? 'overdue' : unpaid.length > 0 ? 'dueSoon' : 'good'
      },
      dues
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Member profile update
app.put('/api/member/profile', verifyToken, async (req, res) => {
  try {
    const { name, phone, civil_status } = req.body;
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Enter your full name.' });
    }
    if (!phone || !/^(\+?63|0)9\d{2}[-\s]?\d{3}[-\s]?\d{4}$/.test(phone.trim())) {
      return res.status(400).json({ success: false, error: 'Enter a valid mobile number.' });
    }

    await pool.query(
      `UPDATE users SET name = $1, phone = $2, civil_status = $3 WHERE id = $4`,
      [name.trim(), phone.trim(), civil_status || 'Single', req.user.id]
    );
    await pool.query(`UPDATE payments SET member_name = $1 WHERE member_id = $2`, [name.trim(), req.user.id]);
    await pool.query(`UPDATE claims SET member_name = $1 WHERE member_id = $2`, [name.trim(), req.user.id]);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Member Beneficiaries
app.get('/api/member/beneficiaries', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM beneficiaries WHERE member_id = $1 ORDER BY created_at ASC`,
      [req.user.id]
    );
    res.json({ success: true, beneficiaries: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/member/beneficiaries', verifyToken, async (req, res) => {
  try {
    const { name, relation, dob } = req.body;
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Enter the beneficiary full name.' });
    }
    if (!dob || new Date(dob) > new Date()) {
      return res.status(400).json({ success: false, error: 'Date of birth cannot be in the future.' });
    }

    const currentCountRes = await pool.query(
      `SELECT COUNT(*) FROM beneficiaries WHERE member_id = $1`,
      [req.user.id]
    );
    if (parseInt(currentCountRes.rows[0].count, 10) >= 5) {
      return res.status(400).json({ success: false, error: 'You can register up to 5 beneficiaries.' });
    }

    if (relation === 'Spouse') {
      const spouseCheck = await pool.query(
        `SELECT 1 FROM beneficiaries WHERE member_id = $1 AND relation = 'Spouse' AND is_deceased = FALSE`,
        [req.user.id]
      );
      if (spouseCheck.rowCount > 0) {
        return res.status(400).json({ success: false, error: 'You already have an active spouse registered.' });
      }
    }

    const id = `BEN-${Date.now().toString(36)}`;
    await pool.query(
      `INSERT INTO beneficiaries (id, member_id, name, relation, dob, is_deceased)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [id, req.user.id, name.trim(), relation, dob]
    );

    res.json({ success: true, message: 'Beneficiary registered.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/member/beneficiaries/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const claimCheck = await pool.query(
      `SELECT 1 FROM claims WHERE beneficiary_id = $1 AND status = 'Pending Review'`,
      [id]
    );
    if (claimCheck.rowCount > 0) {
      return res.status(400).json({ success: false, error: 'This beneficiary has a claim under review and cannot be removed.' });
    }

    await pool.query(`DELETE FROM beneficiaries WHERE id = $1 AND member_id = $2`, [id, req.user.id]);
    res.json({ success: true, message: 'Beneficiary removed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Member Payments
app.get('/api/member/payments', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM payments WHERE member_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, payments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/member/payments', verifyToken, upload.single('proofFile'), async (req, res) => {
  try {
    const { due_id, method, ref_no, amount, payment_date, proofBase64 } = req.body;

    if (!ref_no || ref_no.trim().length < 4) {
      return res.status(400).json({ success: false, error: 'Enter a valid reference number.' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Enter a valid amount paid.' });
    }
    if (!payment_date || new Date(payment_date) > new Date()) {
      return res.status(400).json({ success: false, error: 'Payment date cannot be in the future.' });
    }

    let proof = proofBase64 || null;
    if (req.file) {
      proof = `/uploads/${req.file.filename}`;
    }
    if (method !== 'Office Cash Counter' && !proof) {
      return res.status(400).json({ success: false, error: 'Upload proof of payment screenshot or photo.' });
    }

    let dueTitle = 'General contribution';
    if (due_id && due_id !== 'GENERAL') {
      const dueRes = await pool.query(`SELECT title, amount FROM dues WHERE id = $1`, [due_id]);
      if (dueRes.rowCount > 0) {
        dueTitle = dueRes.rows[0].title;
        if (parsedAmount < parseFloat(dueRes.rows[0].amount)) {
          return res.status(400).json({ success: false, error: `The amount must be at least ₱${dueRes.rows[0].amount} for this due.` });
        }
      }
    }

    // Check duplicate reference
    const dupCheck = await pool.query(
      `SELECT 1 FROM payments WHERE LOWER(ref_no) = LOWER($1) AND method = $2 AND status != 'Rejected'`,
      [ref_no.trim(), method]
    );
    if (dupCheck.rowCount > 0) {
      return res.status(400).json({ success: false, error: 'A payment with this reference number has already been submitted.' });
    }

    const payId = await getNextId('payment');
    await pool.query(
      `INSERT INTO payments (id, member_id, member_name, municipality, due_id, due_title, ref_no, method, amount, payment_date, status, proof)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', $11)`,
      [
        payId,
        req.user.id,
        req.user.name,
        req.user.municipality,
        due_id === 'GENERAL' ? null : due_id,
        dueTitle,
        ref_no.trim(),
        method,
        parsedAmount,
        payment_date,
        proof
      ]
    );

    // Notify Chapter Admin
    await createNotification({
      toChapter: req.user.municipality,
      title: 'Payment awaiting verification',
      message: `${req.user.name} submitted ₱${parsedAmount.toFixed(2)} via ${method} (ref ${ref_no.trim()}).`
    });

    res.json({ success: true, message: 'Payment submitted for verification.', paymentId: payId });
  } catch (err) {
    console.error('Payment submit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Member Claims
app.get('/api/member/claims', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM claims WHERE member_id = $1 ORDER BY filed_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, claims: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/member/claims', verifyToken, upload.single('deathCertFile'), async (req, res) => {
  try {
    const { beneficiary_id, date_of_death, cause, place, deathCertBase64, benefit_ids } = req.body;

    if (!beneficiary_id) {
      return res.status(400).json({ success: false, error: 'Select the beneficiary who passed away.' });
    }
    const benRes = await pool.query(`SELECT * FROM beneficiaries WHERE id = $1 AND member_id = $2`, [beneficiary_id, req.user.id]);
    if (benRes.rowCount === 0) {
      return res.status(400).json({ success: false, error: 'Beneficiary not found.' });
    }
    const ben = benRes.rows[0];
    if (ben.is_deceased) {
      return res.status(400).json({ success: false, error: 'A claim has already been approved for this beneficiary.' });
    }

    if (!date_of_death || new Date(date_of_death) > new Date()) {
      return res.status(400).json({ success: false, error: 'Date of death cannot be in the future.' });
    }
    if (!cause || cause.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Enter the cause of death.' });
    }
    if (!place || place.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Enter the place of death.' });
    }

    let death_cert = deathCertBase64 || null;
    if (req.file) {
      death_cert = `/uploads/${req.file.filename}`;
    }
    if (!death_cert) {
      return res.status(400).json({ success: false, error: 'Upload the death certificate photo or scan.' });
    }

    let parsedBenefitIds = [];
    if (typeof benefit_ids === 'string') {
      try { parsedBenefitIds = JSON.parse(benefit_ids); } catch (_) { parsedBenefitIds = [benefit_ids]; }
    } else if (Array.isArray(benefit_ids)) {
      parsedBenefitIds = benefit_ids;
    }

    if (!parsedBenefitIds.length) {
      return res.status(400).json({ success: false, error: 'Select at least one benefit item requested.' });
    }

    const typesRes = await pool.query(`SELECT * FROM benefit_types WHERE id = ANY($1)`, [parsedBenefitIds]);
    const benefitsList = typesRes.rows.map(b => ({
      id: b.id,
      name: b.name,
      amount: parseFloat(b.amount)
    }));
    const totalAmount = benefitsList.reduce((acc, b) => acc + b.amount, 0);

    const claimId = await getNextId('claim');
    await pool.query(
      `INSERT INTO claims (id, member_id, member_name, municipality, beneficiary_id, deceased_name, date_of_death, cause, place, status, benefits, amount, death_cert)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Pending Review', $10, $11, $12)`,
      [
        claimId,
        req.user.id,
        req.user.name,
        req.user.municipality,
        ben.id,
        `${ben.name} (${ben.relation})`,
        date_of_death,
        cause.trim(),
        place.trim(),
        JSON.stringify(benefitsList),
        totalAmount,
        death_cert
      ]
    );

    // Notify Chapter Admin
    await createNotification({
      toChapter: req.user.municipality,
      title: 'New benefit claim',
      message: `${req.user.name} filed claim ${claimId} for ${ben.name}.`
    });

    res.json({ success: true, message: `Claim ${claimId} submitted for review.`, claimId });
  } catch (err) {
    console.error('Claim submit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// BENEFIT TYPES (Member read & Admin CRUD)
// -------------------------------------------------------------
app.get('/api/benefit-types', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM benefit_types ORDER BY amount DESC`);
    res.json({ success: true, benefitTypes: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/benefit-types', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, amount } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Enter a benefit name.' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Enter an amount greater than zero.' });
    }

    const id = await getNextId('benefit');
    await pool.query(
      `INSERT INTO benefit_types (id, name, description, amount, is_active)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [id, name.trim(), description ? description.trim() : '', parsedAmount]
    );

    res.json({ success: true, message: 'Benefit type created.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/benefit-types/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, amount } = req.body;
    await pool.query(
      `UPDATE benefit_types SET name = $1, description = $2, amount = $3 WHERE id = $4`,
      [name.trim(), description ? description.trim() : '', parseFloat(amount), id]
    );
    res.json({ success: true, message: 'Benefit type updated.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/benefit-types/:id/toggle', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`UPDATE benefit_types SET is_active = NOT is_active WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Benefit status toggled.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/benefit-types/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM benefit_types WHERE id = $1`, [id]);
    res.json({ success: true, message: 'Benefit type deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// ADMIN ENDPOINTS
// -------------------------------------------------------------
app.get('/api/admin/overview', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { municipality } = req.user;
    const isSuper = municipality === 'All';

    // Filter queries based on chapter
    const memWhere = isSuper ? `role = 'member'` : `role = 'member' AND municipality = $1`;
    const dataWhere = isSuper ? `1=1` : `municipality = $1`;
    const duesWhere = isSuper ? `1=1` : `(municipality = $1 OR municipality = 'All')`;
    const params = isSuper ? [] : [municipality];

    const activeMembersRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${memWhere} AND status = 'Active'`,
      params
    );
    const pendingMembersRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${memWhere} AND status = 'Pending'`,
      params
    );

    const approvedPaymentsRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE ${dataWhere} AND status = 'Approved'`,
      params
    );
    const approvedClaimsRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM claims WHERE ${dataWhere} AND status = 'Approved'`,
      params
    );

    const pendingPaymentsCountRes = await pool.query(
      `SELECT COUNT(*) FROM payments WHERE ${dataWhere} AND status = 'Pending'`,
      params
    );
    const pendingClaimsCountRes = await pool.query(
      `SELECT COUNT(*) FROM claims WHERE ${dataWhere} AND status = 'Pending Review'`,
      params
    );

    const reserveFund = parseFloat(approvedPaymentsRes.rows[0].total) - parseFloat(approvedClaimsRes.rows[0].total);
    const payoutsSum = parseFloat(approvedClaimsRes.rows[0].total);

    // Dues for table
    const duesRes = await pool.query(
      `SELECT d.*,
              (SELECT COUNT(*) FROM users u WHERE u.role = 'member' AND u.status = 'Active' AND (d.municipality = 'All' OR u.municipality = d.municipality)) as total_audience,
              (SELECT COUNT(DISTINCT p.member_id) FROM payments p WHERE p.due_id = d.id AND p.status = 'Approved') as paid_count
       FROM dues d
       WHERE ${duesWhere}
       ORDER BY d.created_at DESC`,
      params
    );

    res.json({
      success: true,
      kpis: {
        activeMembers: parseInt(activeMembersRes.rows[0].count, 10),
        pendingUsers: parseInt(pendingMembersRes.rows[0].count, 10),
        reserveFund,
        payoutsSum,
        pendingPayments: parseInt(pendingPaymentsCountRes.rows[0].count, 10),
        pendingClaims: parseInt(pendingClaimsCountRes.rows[0].count, 10)
      },
      dues: duesRes.rows
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Post Dues
app.post('/api/admin/dues', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, amount, due_date } = req.body;
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Enter a title for the dues.' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Enter an amount greater than zero.' });
    }
    if (!due_date || new Date(due_date) < new Date(new Date().toDateString())) {
      return res.status(400).json({ success: false, error: 'Due date cannot be in the past.' });
    }
    if (!description || description.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Enter the particulars for members.' });
    }

    const dueId = await getNextId('due');
    await pool.query(
      `INSERT INTO dues (id, title, description, amount, due_date, municipality, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'Open')`,
      [dueId, title.trim(), description.trim(), parsedAmount, due_date, req.user.municipality]
    );

    // Notify all active members in the chapter
    const memQuery = req.user.municipality === 'All'
      ? `SELECT id FROM users WHERE role = 'member' AND status = 'Active'`
      : `SELECT id FROM users WHERE role = 'member' AND status = 'Active' AND municipality = $1`;
    const memParams = req.user.municipality === 'All' ? [] : [req.user.municipality];
    const members = await pool.query(memQuery, memParams);

    for (const m of members.rows) {
      await createNotification({
        toUser: m.id,
        title: 'New dues posted',
        message: `${title.trim()} — ₱${parsedAmount.toFixed(2)}, due ${new Date(due_date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}.`
      });
    }

    res.json({ success: true, message: 'Dues published successfully.', dueId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/dues/:id/toggle', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE dues SET status = CASE WHEN status = 'Open' THEN 'Closed' ELSE 'Open' END WHERE id = $1`,
      [id]
    );
    res.json({ success: true, message: 'Due status toggled.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Registrations & Members
app.get('/api/admin/registrations', verifyToken, requireAdmin, async (req, res) => {
  try {
    const isSuper = req.user.municipality === 'All';
    const query = isSuper
      ? `SELECT * FROM users WHERE role = 'member' AND status = 'Pending' ORDER BY created_at ASC`
      : `SELECT * FROM users WHERE role = 'member' AND status = 'Pending' AND municipality = $1 ORDER BY created_at ASC`;
    const params = isSuper ? [] : [req.user.municipality];
    const result = await pool.query(query, params);
    res.json({ success: true, registrations: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/members', verifyToken, requireAdmin, async (req, res) => {
  try {
    const isSuper = req.user.municipality === 'All';
    const query = isSuper
      ? `SELECT id, role, name, email, phone, municipality, barangay, civil_status, status, reg_date, created_at
         FROM users WHERE role = 'member' ORDER BY created_at DESC`
      : `SELECT id, role, name, email, phone, municipality, barangay, civil_status, status, reg_date, created_at
         FROM users WHERE role = 'member' AND municipality = $1 ORDER BY created_at DESC`;
    const params = isSuper ? [] : [req.user.municipality];
    const result = await pool.query(query, params);
    res.json({ success: true, members: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/members/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Member not found.' });
    }
    const member = userRes.rows[0];
    const paymentsRes = await pool.query(`SELECT * FROM payments WHERE member_id = $1 ORDER BY created_at DESC`, [id]);
    const claimsRes = await pool.query(`SELECT * FROM claims WHERE member_id = $1 ORDER BY filed_at DESC`, [id]);

    res.json({
      success: true,
      member,
      payments: paymentsRes.rows,
      claims: claimsRes.rows
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/users/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Pending', 'Suspended', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status.' });
    }

    await pool.query(`UPDATE users SET status = $1 WHERE id = $2`, [status, id]);

    const msg = {
      Active: ['Registration approved', 'Your membership is active. Welcome to Kaagapay Dayong.'],
      Rejected: ['Registration not approved', 'Please contact your chapter admin for details.'],
      Suspended: ['Account suspended', 'Please contact your chapter admin.']
    }[status];

    if (msg) {
      await createNotification({ toUser: id, title: msg[0], message: msg[1] });
    }

    res.json({ success: true, message: `Member status updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Payments Verification
app.get('/api/admin/payments', verifyToken, requireAdmin, async (req, res) => {
  try {
    const isSuper = req.user.municipality === 'All';
    const query = isSuper
      ? `SELECT * FROM payments ORDER BY created_at DESC`
      : `SELECT * FROM payments WHERE municipality = $1 ORDER BY created_at DESC`;
    const params = isSuper ? [] : [req.user.municipality];
    const result = await pool.query(query, params);
    res.json({ success: true, payments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/payments/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review_note } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
    }
    if (status === 'Rejected' && (!review_note || !review_note.trim())) {
      return res.status(400).json({ success: false, error: 'A review note is required when rejecting a payment.' });
    }

    const payRes = await pool.query(`SELECT * FROM payments WHERE id = $1`, [id]);
    if (payRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Payment record not found.' });
    }
    const pay = payRes.rows[0];

    await pool.query(
      `UPDATE payments
       SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, review_note ? review_note.trim() : '', req.user.name, id]
    );

    // Notify Member
    await createNotification({
      toUser: pay.member_id,
      title: status === 'Approved' ? 'Payment approved' : 'Payment rejected',
      message: status === 'Approved'
        ? `Your ₱${parseFloat(pay.amount).toFixed(2)} payment (ref ${pay.ref_no}) was confirmed.`
        : `Your payment (ref ${pay.ref_no}) was rejected: ${review_note.trim()}`
    });

    res.json({ success: true, message: `Payment ${pay.ref_no} ${status.toLowerCase()}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Claims Verification
app.get('/api/admin/claims', verifyToken, requireAdmin, async (req, res) => {
  try {
    const isSuper = req.user.municipality === 'All';
    const query = isSuper
      ? `SELECT * FROM claims ORDER BY filed_at DESC`
      : `SELECT * FROM claims WHERE municipality = $1 ORDER BY filed_at DESC`;
    const params = isSuper ? [] : [req.user.municipality];
    const result = await pool.query(query, params);
    res.json({ success: true, claims: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/admin/claims/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, amount, review_note } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be Approved or Rejected.' });
    }
    if (status === 'Rejected' && (!review_note || !review_note.trim())) {
      return res.status(400).json({ success: false, error: 'A review note is required when rejecting a claim.' });
    }

    const claimRes = await pool.query(`SELECT * FROM claims WHERE id = $1`, [id]);
    if (claimRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Claim not found.' });
    }
    const claim = claimRes.rows[0];

    const finalAmount = status === 'Approved' && amount ? parseFloat(amount) : parseFloat(claim.amount);

    await pool.query(
      `UPDATE claims
       SET status = $1, amount = $2, review_note = $3, reviewed_by = $4, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [status, finalAmount, review_note ? review_note.trim() : '', req.user.name, id]
    );

    // If approved, mark beneficiary as deceased
    if (status === 'Approved' && claim.beneficiary_id) {
      await pool.query(
        `UPDATE beneficiaries SET is_deceased = TRUE WHERE id = $1`,
        [claim.beneficiary_id]
      );
    }

    // Notify member
    await createNotification({
      toUser: claim.member_id,
      title: status === 'Approved' ? 'Benefit claim approved' : 'Benefit claim rejected',
      message: status === 'Approved'
        ? `Claim ${claim.id} was approved for ₱${finalAmount.toFixed(2)}. Our chapter will contact you about release.`
        : `Claim ${claim.id} was rejected: ${review_note.trim()}`
    });

    res.json({ success: true, message: `Claim ${claim.id} ${status.toLowerCase()}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Claims History (Released benefits)
app.get('/api/admin/claims-history', verifyToken, requireAdmin, async (req, res) => {
  try {
    const isSuper = req.user.municipality === 'All';
    const query = isSuper
      ? `SELECT * FROM claims WHERE status = 'Approved' ORDER BY reviewed_at DESC`
      : `SELECT * FROM claims WHERE municipality = $1 AND status = 'Approved' ORDER BY reviewed_at DESC`;
    const params = isSuper ? [] : [req.user.municipality];
    const result = await pool.query(query, params);
    res.json({ success: true, history: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Kaagapay Dayong Backend Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Database: ${process.env.DB_NAME || 'kaagapay_dayong'}`);
  console.log(`====================================================`);
});
