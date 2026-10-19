# Kaagapay Dayong — Mutual Aid & Funeral Assistance System

A full-stack community mutual aid and funeral benefit management system designed to streamline workflow, record keeping, dues tracking, and benefit claims adjudication for community chapters.

---

## 🛠️ Technology Stack

- **Database**: PostgreSQL (`pg` pool, `database.sql`, `seed.sql`, automated migration via `setup-database.js`)
- **Backend**: Node.js & Express.js (REST API, JWT authentication, `bcryptjs` password hashing, `multer` file uploads)
- **Frontend (Web)**: React (JavaScript `.jsx`), Vite, Tailwind CSS, FontAwesome 6, Google Font `Public Sans`, `qrcode` canvas rendering
- **Mobile App**: Flutter & Dart (Cross-platform Android / iOS / Web / Desktop, QR generator, offline token persistence, REST API integration)

---

## 📁 Project & File Structure

This repository strictly follows the system structure requested:

```text
Kaagapay_Dayong/
├── Kaagapay-Dayong-System/
│   ├── backend/                    # Node.js + Express API + PostgreSQL
│   ├── frontend/                   # React + Vite Web Application
│   └── mobile/                     # Flutter Cross-Platform Mobile Application
│       ├── pubspec.yaml            # Flutter dependencies (http, qr_flutter, shared_preferences)
│       └── lib/
│           ├── main.dart           # Flutter app entry point & auth routing
│           ├── theme.dart          # Kaagapay brand green & ink color theme
│           ├── api_service.dart    # Centralized HTTP API client with JWT storage
│           └── screens/
│               ├── auth_screen.dart           # Mobile Sign in, Sign up & Demo accounts
│               ├── member_portal_screen.dart  # Mobile Digital ID, Dues, GCash & Claims
│               └── admin_portal_screen.dart   # Mobile KPIs, Dues posting & Claim approvals
│   │   ├── .env.example            # Environment template
│   │   ├── authMiddleware.js       # JWT validation & role guard middleware
│   │   ├── database.sql            # PostgreSQL schema & index creation
│   │   ├── package.json            # Node.js backend dependencies
│   │   ├── seed.sql                # Initial seed data (admins, members, dues, benefits)
│   │   ├── server.js               # Express API server with PostgreSQL pool
│   │   ├── setup-database.js       # Database initialization & automated setup script
│   │   └── uploads/                # Directory for uploaded payment receipts and certificates
│   └── frontend/
│       ├── index.html              # HTML shell with Google Fonts & FontAwesome
│       ├── package.json            # React & Vite frontend dependencies
│       ├── postcss.config.js       # PostCSS config
│       ├── tailwind.config.js      # Custom theme colors (brand & ink) and font configuration
│       ├── vite.config.js          # Vite config with backend API proxy
│       └── src/
│           ├── main.jsx            # React root mount
│           ├── App.jsx             # Main application orchestrator & state manager
│           ├── api.js              # Centralized API service
│           ├── constants.js        # Davao region locations & currency/date formatters
│           ├── index.css           # Tailwind styles, components, animations, & print media
│           └── components/
│               ├── Header.jsx              # Navigation header with notifications dropdown
│               ├── AuthSection.jsx         # Sign in & registration forms with Davao selector
│               ├── Badge.jsx               # Status badge indicators
│               ├── ToastContainer.jsx      # Animated toast notifications
│               ├── DialogModal.jsx         # Accessible modal dialogs
│               ├── AboutModal.jsx          # Chapter administrators overview modal
│               ├── MemberPortal/
│               │   ├── MemberPortal.jsx        # Member portal tab manager
│               │   ├── MemberDashboard.jsx     # Welcome banner, KPIs, dues, printable digital ID
│               │   ├── PaymentsDues.jsx        # Payment channels, submission, & receipt viewer
│               │   ├── ProfileBeneficiaries.jsx# Profile management & registered beneficiaries
│               │   └── BenefitClaims.jsx       # Funeral claim filing with benefit calculator
│               └── AdminPortal/
│                   ├── AdminPortal.jsx         # Admin portal tab manager & chapter badge
│                   ├── AdminOverview.jsx       # 4 KPIs, attention items, post dues form
│                   ├── UserApprovals.jsx       # Pending member registrations review
│                   ├── MemberRegistry.jsx      # Searchable directory with member history
│                   ├── PaymentVerification.jsx # Receipt review, approval & rejection
│                   ├── ClaimsVerification.jsx  # Funeral claim adjudication & death certificate check
│                   ├── ClaimsHistory.jsx       # Audit log of released benefits
│                   └── BenefitTypes.jsx        # Manageable catalog of funeral assistance items
├── package.json                    # Workspace script runners
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Database Setup (PostgreSQL)

Make sure PostgreSQL is running on your machine (or provide a cloud connection string in `.env`).

```bash
# From workspace root
npm run setup:db

# Or directly in the backend folder
cd Kaagapay-Dayong-System/backend
node setup-database.js
```

This will automatically create the `kaagapay_dayong` database, run all tables and indexes from `database.sql`, and populate initial chapter administrators, sample members, benefit types, dues, and claims from `seed.sql`.

### 2. Start Backend API Server

```bash
# In Kaagapay-Dayong-System/backend
npm run dev
```

The backend server runs on `http://localhost:5000`.

### 3. Start Frontend App (React)

```bash
# In Kaagapay-Dayong-System/frontend
npm run dev
```

The React frontend runs on `http://localhost:5173`.

### 4. Start Mobile App (Flutter)

```bash
# In Kaagapay-Dayong-System/mobile
cd Kaagapay-Dayong-System/mobile

# Run on connected Android / iOS device or emulator
flutter run

# Or run Flutter Web in Chrome
flutter run -d chrome

# Or run as Windows desktop application
flutter run -d windows
```

---

## 👥 Demo Accounts

Use these pre-seeded accounts to explore the system:

| Role | Email | Password | Municipality / Chapter | Access |
|---|---|---|---|---|
| **Chapter Admin** | `tagumcity@gmail.com` | `admin123` | Tagum City | Verifies registrations, inspects receipts, approves funeral claims, manages chapter dues & benefit catalog |
| **Member** | `juan.delacruz@email.com` | `member123` | Tagum City | Digital ID card, view chapter dues, submit GCash/bank receipts, register beneficiaries, file benefit claims |
| **Super Admin** | `admin@system.com` | `admin123` | All Chapters | Full administrative view across all Davao Region chapters |
>>>>>>> de7094a (Initial commit: Kaagapay Dayong Mutual Aid and Funeral Assistance Management System)
