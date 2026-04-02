-- =============================================================================
-- Crown Fleet — demo seed (idempotent)
-- =============================================================================
--
-- PREREQUISITES
--   1. Apply all migrations to the target database (e.g. `npx supabase db push`).
--   2. Run this file in the Supabase SQL Editor (postgres role bypasses RLS).
--   3. Optional: run `supabase/seed.sql` first if you also want legacy location
--      codes (858, etc.). This seed is self-contained via CROWN-* locations.
--
-- RUN ORDER
--   Migrations → (optional seed.sql) → this file.
--
-- RESET (demo database only)
--   To remove demo vehicles and dependent rows (CASCADE), run:
--     DELETE FROM vehicles WHERE vin LIKE '1DEMFLEET%';
--   To clear only re-insertable demo rows (receipts/maintenance/alerts tagged
--   in notes), this script deletes those sections before insert.
--
-- Vercel + Auth bootstrap: see docs/demo-crownfleet.md
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Locations (nationwide hubs)
-- -----------------------------------------------------------------------------
INSERT INTO locations (code, name, address) VALUES
  ('CROWN-CT', 'Crown — Greenwich hub', 'Greenwich, CT 06830'),
  ('CROWN-CA', 'Crown — Beverly Hills hub', 'Beverly Hills, CA 90210'),
  ('CROWN-FL', 'Crown — Miami hub', 'Miami, FL 33131'),
  ('CROWN-SC', 'Crown — Charleston hub', 'Charleston, SC 29401'),
  ('CROWN-NYC', 'Crown — Manhattan garage', 'New York, NY 10022')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2) Vehicles (10 luxury fleet — synthetic VINs prefixed 1DEMFLEET…)
-- -----------------------------------------------------------------------------
INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-CT' LIMIT 1),
  'Mercedes-Benz', 'G 63 AMG', 2024, '1DEMFLEET00000001', 'CF-8G63', 'Obsidian Black', NULL, 'active',
  'Primary Greenwich SUV — winter tires on file.', 12400
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000001');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-CA' LIMIT 1),
  'Porsche', 'Cayenne Turbo', 2023, '1DEMFLEET00000002', '8XPCYEN', 'Carmine Red', 'Turbo', 'active',
  'West Coast runabout — PEC delivery.', 18200
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000002');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-FL' LIMIT 1),
  'Mercedes-Benz', 'S 600', 2015, '1DEMFLEET00000003', 'FL-S6001', 'Black', NULL, 'active',
  'Miami house car — chauffeur schedule in ops notes.', 45200
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000003');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-SC' LIMIT 1),
  'BMW', 'X7', 2024, '1DEMFLEET00000004', 'SC-X7M6', 'Mineral White', 'M60i', 'active',
  'Lowcountry family hauler — third row configured.', 8900
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000004');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-CT' LIMIT 1),
  'BMW', 'M5', 2022, '1DEMFLEET00000005', 'CT-M5CP', 'Isle of Man Green', 'Competition', 'active',
  'Track days allowed — Pirelli P Zero stocked.', 22100
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000005');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-CA' LIMIT 1),
  'Land Rover', 'Range Rover', 2023, '1DEMFLEET00000006', '7RRVRRG', 'Santorini Black', 'Autobiography', 'active',
  'LA / Palm Springs shuttle — air suspension service history clean.', 15600
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000006');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-FL' LIMIT 1),
  'Bentley', 'Bentayga', 2022, '1DEMFLEET00000007', 'FL-BENT1', 'Ice', 'Speed', 'active',
  'Art Basel week vehicle — valet protocol on file.', 12800
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000007');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-SC' LIMIT 1),
  'Audi', 'RS Q8', 2024, '1DEMFLEET00000008', 'SC-RSQ8', 'Nardo Grey', NULL, 'active',
  'Coastal highway cruiser — ceramic coating 06/2025.', 6200
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000008');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-CA' LIMIT 1),
  'Lamborghini', 'Urus', 2021, '1DEMFLEET00000009', 'CF-URUS', 'Giallo Auge', NULL, 'active',
  'Malibu / BH circuit — annual service prepaid package.', 19800
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000009');

INSERT INTO vehicles (location_id, make, model, year, vin, license_plate, color, trim, status, notes, current_odometer)
SELECT (SELECT id FROM locations WHERE code = 'CROWN-NYC' LIMIT 1),
  'Rolls-Royce', 'Cullinan', 2023, '1DEMFLEET00000010', 'NYC-RR1', 'Arctic White', 'Black Badge', 'active',
  'Manhattan evening car — partition privacy glass.', 4100
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1DEMFLEET00000010');

-- -----------------------------------------------------------------------------
-- 3) Registrations (multi-state — staggered expiries for Expiring soon)
-- -----------------------------------------------------------------------------
INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'CT', (CURRENT_DATE + INTERVAL '45 days')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000001'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'CA', (CURRENT_DATE + INTERVAL '18 months')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000002'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'FL', (CURRENT_DATE + INTERVAL '72 days')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000003'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'SC', (CURRENT_DATE + INTERVAL '8 months')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000004'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'CT', (CURRENT_DATE + INTERVAL '22 days')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000005'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'CA', (CURRENT_DATE + INTERVAL '55 days')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000006'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'FL', (CURRENT_DATE + INTERVAL '14 months')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000007'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'SC', (CURRENT_DATE + INTERVAL '38 days')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000008'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'CA', (CURRENT_DATE + INTERVAL '11 months')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000009'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

INSERT INTO registrations (vehicle_id, state, expiry_date, document_url)
SELECT v.id, 'NY', (CURRENT_DATE + INTERVAL '67 days')::date,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000010'
  AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.vehicle_id = v.id);

-- -----------------------------------------------------------------------------
-- 4) Insurance (spread expiries)
-- -----------------------------------------------------------------------------
INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'Chubb Private Client', 'CHB-CF-24001', (CURRENT_DATE + INTERVAL '90 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000001'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'AIG Private Client Group', 'AIG-CF-8832', (CURRENT_DATE + INTERVAL '200 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000002'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'PURE Insurance', 'PURE-FL-9921', (CURRENT_DATE + INTERVAL '30 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000003'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'Chubb Private Client', 'CHB-CF-24002', (CURRENT_DATE + INTERVAL '120 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000004'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'Nationwide Private Client', 'NW-CT-44102', (CURRENT_DATE + INTERVAL '60 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000005'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'AIG Private Client Group', 'AIG-CF-8833', (CURRENT_DATE + INTERVAL '150 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000006'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'PURE Insurance', 'PURE-FL-9922', (CURRENT_DATE + INTERVAL '45 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000007'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'Chubb Private Client', 'CHB-CF-24003', (CURRENT_DATE + INTERVAL '180 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000008'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'AIG Private Client Group', 'AIG-CF-8834', (CURRENT_DATE + INTERVAL '25 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000009'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

INSERT INTO insurance (vehicle_id, provider, policy_number, expiry_date, document_url)
SELECT v.id, 'Chubb Private Client', 'CHB-CF-NYC01', (CURRENT_DATE + INTERVAL '100 days')::date, NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000010'
  AND NOT EXISTS (SELECT 1 FROM insurance i WHERE i.vehicle_id = v.id);

-- -----------------------------------------------------------------------------
-- 5) Warranties (mixed near-term and long-dated)
-- -----------------------------------------------------------------------------
INSERT INTO vehicle_warranties (vehicle_id, warranty_type, expiry_date, expiry_miles, notes, document_url)
SELECT v.id, 'bumper_to_bumper'::warranty_type, (CURRENT_DATE + INTERVAL '75 days')::date, NULL,
  'Crown demo — factory limited', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000001'
  AND NOT EXISTS (SELECT 1 FROM vehicle_warranties w WHERE w.vehicle_id = v.id AND w.warranty_type = 'bumper_to_bumper');

INSERT INTO vehicle_warranties (vehicle_id, warranty_type, expiry_date, expiry_miles, notes, document_url)
SELECT v.id, 'powertrain_warranty'::warranty_type, (CURRENT_DATE + INTERVAL '4 years')::date, 80000,
  'Crown demo — powertrain', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000001'
  AND NOT EXISTS (SELECT 1 FROM vehicle_warranties w WHERE w.vehicle_id = v.id AND w.warranty_type = 'powertrain_warranty');

INSERT INTO vehicle_warranties (vehicle_id, warranty_type, expiry_date, expiry_miles, notes, document_url)
SELECT v.id, 'powertrain_warranty'::warranty_type, (CURRENT_DATE + INTERVAL '50 days')::date, 95000,
  'Crown demo — CPO powertrain ending soon', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000002'
  AND NOT EXISTS (SELECT 1 FROM vehicle_warranties w WHERE w.vehicle_id = v.id AND w.warranty_type = 'powertrain_warranty');

INSERT INTO vehicle_warranties (vehicle_id, warranty_type, expiry_date, expiry_miles, notes, document_url)
SELECT v.id, 'limited_warranty'::warranty_type, (CURRENT_DATE + INTERVAL '14 months')::date, NULL,
  'Crown demo — extended limited', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000004'
  AND NOT EXISTS (SELECT 1 FROM vehicle_warranties w WHERE w.vehicle_id = v.id AND w.warranty_type = 'limited_warranty');

INSERT INTO vehicle_warranties (vehicle_id, warranty_type, expiry_date, expiry_miles, notes, document_url)
SELECT v.id, 'bumper_to_bumper'::warranty_type, (CURRENT_DATE + INTERVAL '20 days')::date, NULL,
  'Crown demo — expiring bumper coverage', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000005'
  AND NOT EXISTS (SELECT 1 FROM vehicle_warranties w WHERE w.vehicle_id = v.id AND w.warranty_type = 'bumper_to_bumper');

INSERT INTO vehicle_warranties (vehicle_id, warranty_type, expiry_date, expiry_miles, notes, document_url)
SELECT v.id, 'corrosion_warranty'::warranty_type, (CURRENT_DATE + INTERVAL '6 years')::date, NULL,
  'Crown demo — corrosion coverage', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000006'
  AND NOT EXISTS (SELECT 1 FROM vehicle_warranties w WHERE w.vehicle_id = v.id AND w.warranty_type = 'corrosion_warranty');

-- -----------------------------------------------------------------------------
-- 6) Receipts — remove prior demo rows, then insert (category must match enum)
-- -----------------------------------------------------------------------------
DELETE FROM receipts
WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vin LIKE '1DEMFLEET%')
  AND COALESCE(notes, '') LIKE 'Crown Fleet demo receipt:%';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'gas'::receipt_category, 124.88, (CURRENT_DATE - 3)::date, 'Shell V-Power',
  'Crown Fleet demo receipt: G63 fuel', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000001';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'detailing'::receipt_category, 289.00, (CURRENT_DATE - 11)::date, 'AutoNuvo Greenwich',
  'Crown Fleet demo receipt: ceramic maintenance wash', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000001';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'parking'::receipt_category, 48.00, (CURRENT_DATE - 6)::date, 'Harbor Point Garage',
  'Crown Fleet demo receipt: overnight', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000001';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'gas'::receipt_category, 98.42, (CURRENT_DATE - 2)::date, 'Chevron',
  'Crown Fleet demo receipt: Cayenne fill', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000002';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'ez_pass'::receipt_category, 62.50, (CURRENT_DATE - 19)::date, 'FasTrak',
  'Crown Fleet demo receipt: tolls LA corridor', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000002';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'food'::receipt_category, 84.20, (CURRENT_DATE - 9)::date, 'Postmates',
  'Crown Fleet demo receipt: road trip snacks', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000002';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'maintenance'::receipt_category, 425.00, (CURRENT_DATE - 24)::date, 'Mercedes-Benz of Miami',
  'Crown Fleet demo receipt: A-service', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000003';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'miscellaneous'::receipt_category, 35.00, (CURRENT_DATE - 5)::date, 'Car wash tunnel',
  'Crown Fleet demo receipt: express wash', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000003';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'auto_supplies'::receipt_category, 189.99, (CURRENT_DATE - 17)::date, 'WeatherTech',
  'Crown Fleet demo receipt: floor liners', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000004';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'gas'::receipt_category, 102.10, (CURRENT_DATE - 4)::date, 'BP',
  'Crown Fleet demo receipt: X7 fill', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000004';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'parking'::receipt_category, 22.00, (CURRENT_DATE - 1)::date, 'Historic District Lot',
  'Crown Fleet demo receipt: dinner parking', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000004';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'maintenance'::receipt_category, 1299.00, (CURRENT_DATE - 40)::date, 'BMW of Darien',
  'Crown Fleet demo receipt: brake fluid + pads', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000005';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'detailing'::receipt_category, 450.00, (CURRENT_DATE - 14)::date, 'Gloss It',
  'Crown Fleet demo receipt: paint correction spot', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000005';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'gas'::receipt_category, 118.33, (CURRENT_DATE - 7)::date, 'Shell',
  'Crown Fleet demo receipt: M5 93 octane', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000005';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'parking'::receipt_category, 65.00, (CURRENT_DATE - 12)::date, 'SoFi Stadium Parking',
  'Crown Fleet demo receipt: event parking', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000006';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'food'::receipt_category, 42.18, (CURRENT_DATE - 8)::date, 'In-N-Out',
  'Crown Fleet demo receipt: crew meal', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000006';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'gas'::receipt_category, 111.05, (CURRENT_DATE - 3)::date, '76',
  'Crown Fleet demo receipt: RR fill', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000006';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'detailing'::receipt_category, 675.00, (CURRENT_DATE - 21)::date, 'Miami Auto Spa',
  'Crown Fleet demo receipt: full detail pre-event', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000007';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'miscellaneous'::receipt_category, 120.00, (CURRENT_DATE - 15)::date, 'Valet monthly',
  'Crown Fleet demo receipt: Brickell garage', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000007';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'ez_pass'::receipt_category, 28.75, (CURRENT_DATE - 30)::date, 'SunPass',
  'Crown Fleet demo receipt: tolls A1A', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000007';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'gas'::receipt_category, 95.60, (CURRENT_DATE - 5)::date, 'Costco Gas',
  'Crown Fleet demo receipt: RS Q8 fill', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000008';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'auto_supplies'::receipt_category, 64.00, (CURRENT_DATE - 18)::date, 'Chemical Guys',
  'Crown Fleet demo receipt: detailing supplies', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000008';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'maintenance'::receipt_category, 890.00, (CURRENT_DATE - 33)::date, 'Audi Charleston',
  'Crown Fleet demo receipt: 20k service', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000008';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'gas'::receipt_category, 142.50, (CURRENT_DATE - 4)::date, 'Shell V-Power',
  'Crown Fleet demo receipt: Urus fill', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000009';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'parking'::receipt_category, 85.00, (CURRENT_DATE - 10)::date, 'Rodeo Drive Valet',
  'Crown Fleet demo receipt: shopping day', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000009';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'food'::receipt_category, 210.00, (CURRENT_DATE - 6)::date, 'Nobu Malibu',
  'Crown Fleet demo receipt: client dinner (mileage note)', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000009';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'parking'::receipt_category, 95.00, (CURRENT_DATE - 2)::date, 'Icon Parking — UES',
  'Crown Fleet demo receipt: overnight NYC', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000010';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'detailing'::receipt_category, 520.00, (CURRENT_DATE - 13)::date, 'Luxury Auto Detail NYC',
  'Crown Fleet demo receipt: Cullinan interior', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000010';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'miscellaneous'::receipt_category, 18.00, (CURRENT_DATE - 20)::date, 'NYC Congestion',
  'Crown Fleet demo receipt: congestion toll', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000010';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, l.id, 'gas'::receipt_category, 76.40, (CURRENT_DATE - 16)::date, 'Mobil',
  'Crown Fleet demo receipt: fuel while relocated to CT hub', NULL, NULL
FROM vehicles v CROSS JOIN locations l
WHERE v.vin = '1DEMFLEET00000002' AND l.code = 'CROWN-CT' LIMIT 1;

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, l.id, 'parking'::receipt_category, 54.00, (CURRENT_DATE - 27)::date, 'MIA Airport Economy',
  'Crown Fleet demo receipt: airport drop — Cayenne', NULL, NULL
FROM vehicles v CROSS JOIN locations l
WHERE v.vin = '1DEMFLEET00000002' AND l.code = 'CROWN-FL' LIMIT 1;

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'maintenance'::receipt_category, 2100.00, (CURRENT_DATE - 55)::date, 'Lamborghini Beverly Hills',
  'Crown Fleet demo receipt: annual service Urus', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000009';

INSERT INTO receipts (vehicle_id, location_id, category, amount, date, vendor, notes, document_url, created_by)
SELECT v.id, v.location_id, 'auto_supplies'::receipt_category, 312.00, (CURRENT_DATE - 22)::date, 'Tire Rack',
  'Crown Fleet demo receipt: winter wheel set deposit', NULL, NULL FROM vehicles v WHERE v.vin = '1DEMFLEET00000004';

-- -----------------------------------------------------------------------------
-- 7) Maintenance records (completed) — re-runnable
-- -----------------------------------------------------------------------------
DELETE FROM maintenance_records
WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vin LIKE '1DEMFLEET%')
  AND COALESCE(description, '') LIKE 'Crown Fleet demo maintenance:%';

INSERT INTO maintenance_records (vehicle_id, type, description, odometer, cost, date, vendor, receipt_url, next_due_miles, next_due_date, status, created_by)
SELECT v.id, 'oil'::maintenance_type, 'Crown Fleet demo maintenance: synthetic oil + filter', 11800, 189.00,
  (CURRENT_DATE - 45)::date, 'MB Greenwich', NULL, 14800, (CURRENT_DATE + INTERVAL '120 days')::date, 'completed', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000001';

INSERT INTO maintenance_records (vehicle_id, type, description, odometer, cost, date, vendor, receipt_url, next_due_miles, next_due_date, status, created_by)
SELECT v.id, 'tire_rotation'::maintenance_type, 'Crown Fleet demo maintenance: rotate + balance', 17500, 120.00,
  (CURRENT_DATE - 20)::date, 'Porsche LA', NULL, 23500, NULL, 'completed', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000002';

INSERT INTO maintenance_records (vehicle_id, type, description, odometer, cost, date, vendor, receipt_url, next_due_miles, next_due_date, status, created_by)
SELECT v.id, 'brakes'::maintenance_type, 'Crown Fleet demo maintenance: rear pads + sensors', 44800, 890.00,
  (CURRENT_DATE - 60)::date, 'Indie Euro Miami', NULL, NULL, NULL, 'completed', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000003';

INSERT INTO maintenance_records (vehicle_id, type, description, odometer, cost, date, vendor, receipt_url, next_due_miles, next_due_date, status, created_by)
SELECT v.id, 'inspection'::maintenance_type, 'Crown Fleet demo maintenance: SC state inspection', 8100, 25.00,
  (CURRENT_DATE - 90)::date, 'Quick Lane Charleston', NULL, NULL, (CURRENT_DATE + INTERVAL '300 days')::date, 'completed', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000004';

INSERT INTO maintenance_records (vehicle_id, type, description, odometer, cost, date, vendor, receipt_url, next_due_miles, next_due_date, status, created_by)
SELECT v.id, 'general'::maintenance_type, 'Crown Fleet demo maintenance: pre-track nut torque check', 21800, 0,
  (CURRENT_DATE - 8)::date, 'In-house', NULL, NULL, NULL, 'completed', NULL
FROM vehicles v WHERE v.vin = '1DEMFLEET00000005';

-- -----------------------------------------------------------------------------
-- 8) Maintenance alerts (open / near-term)
-- -----------------------------------------------------------------------------
DELETE FROM maintenance_alerts
WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vin LIKE '1DEMFLEET%')
  AND (alert_type LIKE 'Crown demo:%' OR alert_type LIKE 'Crown Fleet demo:%');

INSERT INTO maintenance_alerts (vehicle_id, alert_type, due_date, due_miles, severity, dismissed)
SELECT v.id, 'Crown demo: Registration renewal window', (CURRENT_DATE + INTERVAL '40 days')::date, NULL, 'medium', FALSE
FROM vehicles v WHERE v.vin = '1DEMFLEET00000001';

INSERT INTO maintenance_alerts (vehicle_id, alert_type, due_date, due_miles, severity, dismissed)
SELECT v.id, 'Crown demo: Annual inspection due', (CURRENT_DATE + INTERVAL '25 days')::date, NULL, 'high', FALSE
FROM vehicles v WHERE v.vin = '1DEMFLEET00000004';

INSERT INTO maintenance_alerts (vehicle_id, alert_type, due_date, due_miles, severity, dismissed)
SELECT v.id, 'Crown demo: Tire replacement threshold', NULL, 24500, 'low', FALSE
FROM vehicles v WHERE v.vin = '1DEMFLEET00000006';

INSERT INTO maintenance_alerts (vehicle_id, alert_type, due_date, due_miles, severity, dismissed)
SELECT v.id, 'Crown demo: Insurance renewal follow-up', (CURRENT_DATE + INTERVAL '32 days')::date, NULL, 'medium', FALSE
FROM vehicles v WHERE v.vin = '1DEMFLEET00000009';

-- -----------------------------------------------------------------------------
-- 9) Optional document vault samples (placeholder PDF)
-- -----------------------------------------------------------------------------
INSERT INTO vehicle_documents (vehicle_id, doc_type, title, document_url, notes)
SELECT v.id, 'registration', 'Registration card (demo)',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'Crown Fleet demo document'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000001'
  AND NOT EXISTS (
    SELECT 1 FROM vehicle_documents d WHERE d.vehicle_id = v.id AND d.title = 'Registration card (demo)'
  );

INSERT INTO vehicle_documents (vehicle_id, doc_type, title, document_url, notes)
SELECT v.id, 'warranty', 'Extended warranty summary (demo)',
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'Crown Fleet demo document'
FROM vehicles v WHERE v.vin = '1DEMFLEET00000005'
  AND NOT EXISTS (
    SELECT 1 FROM vehicle_documents d WHERE d.vehicle_id = v.id AND d.title = 'Extended warranty summary (demo)'
  );

-- Done.
