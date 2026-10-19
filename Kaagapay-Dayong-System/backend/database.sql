-- Kaagapay Dayong Database Schema
-- Mutual Aid and Funeral Assistance Management System

-- Drop tables if needed during fresh install
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS dues CASCADE;
DROP TABLE IF EXISTS beneficiaries CASCADE;
DROP TABLE IF EXISTS benefit_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS counters CASCADE;

-- 1. Counters table for generating formatted IDs (e.g. KD-2026-088, DUE-2026-004, PAY-0100, CLM-2026-001)
CREATE TABLE counters (
    kind VARCHAR(50) PRIMARY KEY,
    seq_value INTEGER NOT NULL DEFAULT 1
);

-- 2. Users table (Members & Administrators)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(40) NOT NULL DEFAULT '',
    municipality VARCHAR(100) NOT NULL,
    barangay VARCHAR(100) NOT NULL DEFAULT '',
    civil_status VARCHAR(30) NOT NULL DEFAULT 'Single' CHECK (civil_status IN ('Single', 'Married', 'Widowed', 'Separated')),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Active', 'Pending', 'Suspended', 'Rejected')),
    reg_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_municipality ON users(municipality);

-- 3. Benefit Types Catalog (Admin-managed line items for claims)
CREATE TABLE benefit_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Beneficiaries (Family members covered under a member's mutual aid)
CREATE TABLE beneficiaries (
    id VARCHAR(50) PRIMARY KEY,
    member_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    relation VARCHAR(50) NOT NULL CHECK (relation IN ('Spouse', 'Child', 'Parent', 'Sibling')),
    dob DATE NOT NULL,
    is_deceased BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_beneficiaries_member ON beneficiaries(member_id);

-- 5. Community Dues (Posted death contributions / chapter dues)
CREATE TABLE dues (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dues_municipality ON dues(municipality);
CREATE INDEX idx_dues_status ON dues(status);

-- 6. Member Payments
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY,
    member_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_name VARCHAR(120) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    due_id VARCHAR(50) REFERENCES dues(id) ON DELETE SET NULL,
    due_title VARCHAR(150),
    ref_no VARCHAR(60) NOT NULL,
    method VARCHAR(50) NOT NULL CHECK (method IN ('GCash', 'Bank Transfer', 'Office Cash Counter')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    proof TEXT,
    review_note TEXT DEFAULT '',
    reviewed_by VARCHAR(120),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_due ON payments(due_id);
CREATE INDEX idx_payments_status ON payments(status);

-- 7. Benefit Claims (Funeral Assistance Claims filed by members)
CREATE TABLE claims (
    id VARCHAR(50) PRIMARY KEY,
    member_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_name VARCHAR(120) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    beneficiary_id VARCHAR(50) REFERENCES beneficiaries(id) ON DELETE SET NULL,
    deceased_name VARCHAR(120) NOT NULL,
    date_of_death DATE NOT NULL,
    cause VARCHAR(150) NOT NULL,
    place VARCHAR(200) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending Review' CHECK (status IN ('Pending Review', 'Approved', 'Rejected')),
    benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    death_cert TEXT NOT NULL,
    review_note TEXT DEFAULT '',
    reviewed_by VARCHAR(120),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    filed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_claims_member ON claims(member_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_municipality ON claims(municipality);

-- 8. Notifications
CREATE TABLE notifications (
    id VARCHAR(50) PRIMARY KEY,
    to_user VARCHAR(50),
    to_chapter VARCHAR(100),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    read_by JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_to_user ON notifications(to_user);
CREATE INDEX idx_notifications_to_chapter ON notifications(to_chapter);
