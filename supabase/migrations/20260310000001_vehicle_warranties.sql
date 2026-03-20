-- Warranty types for vehicles
CREATE TYPE warranty_type AS ENUM (
  'limited_warranty',
  'powertrain_warranty',
  'bumper_to_bumper',
  'corrosion_warranty',
  'emissions_warranty',
  'hybrid_battery_warranty',
  'other'
);

CREATE TABLE vehicle_warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  warranty_type warranty_type NOT NULL,
  expiry_date DATE,
  expiry_miles INTEGER,
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_warranties_vehicle ON vehicle_warranties(vehicle_id);
CREATE INDEX idx_vehicle_warranties_expiry ON vehicle_warranties(expiry_date);

ALTER TABLE vehicle_warranties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle warranties: admin full access" ON vehicle_warranties
  FOR ALL USING (is_admin_role());

CREATE POLICY "Vehicle warranties: drivers read" ON vehicle_warranties
  FOR SELECT USING (
    get_user_role() = 'driver'
    AND vehicle_id IN (
      SELECT id FROM vehicles
      WHERE location_id IS NULL OR driver_can_access_location(location_id)
    )
  );
