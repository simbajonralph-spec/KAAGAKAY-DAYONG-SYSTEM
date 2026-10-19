-- Kaagapay Dayong Seed Data
-- Initial Chapter Administrators, Demo Members, Dues, and Benefit Types

-- 1. Initialize counters
INSERT INTO counters (kind, seq_value) VALUES
    ('member', 102),
    ('due', 6),
    ('payment', 101),
    ('claim', 1),
    ('notif', 5),
    ('benefit', 5)
ON CONFLICT (kind) DO UPDATE SET seq_value = EXCLUDED.seq_value;

-- 2. Insert Chapter Administrators (Password: admin123)
-- Hash: $2a$10$BPWzWdM4uQ52OxP9lJICJuTrY6Yjck6m73wg0uCCsVd5NYTYLpOSe
INSERT INTO users (id, role, name, email, password_hash, phone, municipality, barangay, civil_status, status, reg_date) VALUES
    ('ADM-TAGUMCITY', 'admin', 'Admin Ralph Simbajon', 'tagumcity@gmail.com', '$2a$10$BPWzWdM4uQ52OxP9lJICJuTrY6Yjck6m73wg0uCCsVd5NYTYLpOSe', '0917-888-9999', 'Tagum City', 'Purok 1-B, Magugpo North', 'Single', 'Active', '2026-01-01'),
    ('ADM-CARMEN', 'admin', 'Admin Maria Clara', 'carmen@gmail.com', '$2a$10$BPWzWdM4uQ52OxP9lJICJuTrY6Yjck6m73wg0uCCsVd5NYTYLpOSe', '0918-777-1111', 'Carmen', 'Barangay Poblacion', 'Single', 'Active', '2026-01-01'),
    ('ADM-MAWAB', 'admin', 'Admin Juan Santos', 'mawab@gmail.com', '$2a$10$BPWzWdM4uQ52OxP9lJICJuTrY6Yjck6m73wg0uCCsVd5NYTYLpOSe', '0920-555-2222', 'Mawab', 'Poblacion', 'Single', 'Active', '2026-01-01'),
    ('ADM-PANABO', 'admin', 'Admin Grace Poe', 'panabo@gmail.com', '$2a$10$BPWzWdM4uQ52OxP9lJICJuTrY6Yjck6m73wg0uCCsVd5NYTYLpOSe', '0922-333-4444', 'Panabo City', 'Gredu', 'Single', 'Active', '2026-01-01'),
    ('ADM-DAVAO', 'admin', 'Admin Carlos Yulo', 'davao@gmail.com', '$2a$10$BPWzWdM4uQ52OxP9lJICJuTrY6Yjck6m73wg0uCCsVd5NYTYLpOSe', '0919-444-8888', 'Davao City', 'Buhangin', 'Single', 'Active', '2026-01-01'),
    ('ADM-SYSTEM', 'admin', 'System Super Admin', 'admin@system.com', '$2a$10$BPWzWdM4uQ52OxP9lJICJuTrY6Yjck6m73wg0uCCsVd5NYTYLpOSe', '', 'All', '', 'Single', 'Active', '2026-01-01')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Demo Members (Password: member123)
-- Hash: $2a$10$QN68pvE6cD8zCFgJjyxzE.IbyiA3USflBOCVbxS2KXlybe09DaxB2
INSERT INTO users (id, role, name, email, password_hash, phone, municipality, barangay, civil_status, status, reg_date) VALUES
    ('KD-2026-088', 'member', 'Juan Dela Cruz', 'juan.delacruz@email.com', '$2a$10$QN68pvE6cD8zCFgJjyxzE.IbyiA3USflBOCVbxS2KXlybe09DaxB2', '0917-123-4567', 'Tagum City', 'Purok 1-B, Magugpo North', 'Married', 'Active', '2026-09-01'),
    ('KD-2026-042', 'member', 'Rosa Santos', 'rosa.santos@email.com', '$2a$10$QN68pvE6cD8zCFgJjyxzE.IbyiA3USflBOCVbxS2KXlybe09DaxB2', '0918-999-1122', 'Tagum City', 'San Vicente', 'Single', 'Active', '2026-09-05'),
    ('KD-2026-015', 'member', 'Mario Gonzales', 'mario.g@email.com', '$2a$10$QN68pvE6cD8zCFgJjyxzE.IbyiA3USflBOCVbxS2KXlybe09DaxB2', '0922-333-4455', 'Carmen', 'Tuganay', 'Widowed', 'Active', '2026-09-10'),
    ('KD-2026-102', 'member', 'Alex Johnson', 'alex@gmail.com', '$2a$10$QN68pvE6cD8zCFgJjyxzE.IbyiA3USflBOCVbxS2KXlybe09DaxB2', '0917-555-8888', 'Tagum City', 'Visayan', 'Single', 'Pending', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT (email) DO NOTHING;

-- 4. Benefit Types Catalog
INSERT INTO benefit_types (id, name, description, amount, is_active) VALUES
    ('BNF-001', 'Standard funeral assistance', 'Base cash assistance released to the family.', 20000.00, true),
    ('BNF-002', 'Coffin / casket', 'Standard casket provided or reimbursed.', 15000.00, true),
    ('BNF-003', 'Flowers', 'Floral arrangement for the wake.', 2000.00, true),
    ('BNF-004', 'Decoration & tent', 'Wake tent, chairs and decoration.', 3000.00, true),
    ('BNF-005', 'Memorial service', 'Officiant and memorial service fee.', 3000.00, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Beneficiaries
INSERT INTO beneficiaries (id, member_id, name, relation, dob, is_deceased) VALUES
    ('BEN-1', 'KD-2026-088', 'Maria Dela Cruz', 'Spouse', '1988-04-12', false),
    ('BEN-2', 'KD-2026-088', 'Pedro Dela Cruz', 'Child', '2012-08-20', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Posted Community Dues
INSERT INTO dues (id, title, description, amount, due_date, municipality, status) VALUES
    ('DUE-2026-004', 'Death Contribution #2026-004', 'Late Maria Santos (Brgy. San Vicente)', 50.00, CURRENT_DATE - INTERVAL '5 days', 'Tagum City', 'Open'),
    ('DUE-2026-005', 'Death Contribution #2026-005', 'Late Pedro Penduko (Brgy. Visayan)', 50.00, CURRENT_DATE + INTERVAL '10 days', 'Tagum City', 'Open'),
    ('DUE-2026-006', 'Death Contribution #2026-006', 'Late Ana Reyes (Brgy. Poblacion)', 50.00, CURRENT_DATE + INTERVAL '12 days', 'Carmen', 'Open')
ON CONFLICT (id) DO NOTHING;

-- 7. Payment History
INSERT INTO payments (id, member_id, member_name, municipality, due_id, due_title, ref_no, method, amount, payment_date, status, proof, review_note) VALUES
    ('PAY-0100', 'KD-2026-088', 'Juan Dela Cruz', 'Tagum City', 'DUE-2026-004', 'Death Contribution #2026-004', '10029384728', 'GCash', 50.00, CURRENT_DATE - INTERVAL '8 days', 'Approved', 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22480%22%20height%3D%22320%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23216b45%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23fff%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EGCash%20receipt%2010029384728%3C%2Ftext%3E%3C%2Fsvg%3E', '')
ON CONFLICT (id) DO NOTHING;

-- 8. Funeral Benefit Claims
INSERT INTO claims (id, member_id, member_name, municipality, beneficiary_id, deceased_name, date_of_death, cause, place, status, benefits, amount, death_cert, review_note) VALUES
    ('CLM-2026-001', 'KD-2026-088', 'Juan Dela Cruz', 'Tagum City', NULL, 'Elena Dela Cruz (Parent)', CURRENT_DATE - INTERVAL '19 days', 'Natural causes', 'Tagum City Hospital', 'Pending Review', '[{"id":"BNF-001","name":"Standard funeral assistance","amount":20000},{"id":"BNF-003","name":"Flowers","amount":2000}]'::jsonb, 22000.00, 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22480%22%20height%3D%22320%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%230f172a%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%23fff%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20text-anchor%3D%22middle%22%20dominant-baseline%3D%22middle%22%3EDeath%20certificate%20(sample)%3C%2Ftext%3E%3C%2Fsvg%3E', '')
ON CONFLICT (id) DO NOTHING;

-- 9. Sample Notifications
INSERT INTO notifications (id, to_user, to_chapter, title, message, read_by) VALUES
    ('NOTIF-001', NULL, 'Tagum City', 'New registration', 'Alex Johnson (Visayan) is waiting for approval.', '[]'::jsonb),
    ('NOTIF-002', NULL, 'Tagum City', 'New benefit claim', 'Juan Dela Cruz filed claim CLM-2026-001 for Elena Dela Cruz.', '[]'::jsonb),
    ('NOTIF-003', 'KD-2026-088', NULL, 'Payment approved', 'Your ₱50.00 payment (ref 10029384728) was confirmed.', '[]'::jsonb),
    ('NOTIF-004', 'KD-2026-088', NULL, 'New dues posted', 'Death Contribution #2026-005 — ₱50.00, due in 10 days.', '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;
