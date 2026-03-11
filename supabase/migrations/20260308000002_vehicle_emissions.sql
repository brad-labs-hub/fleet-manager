-- Emissions test records per vehicle
CREATE TABLE IF NOT EXISTS vehicle_emissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  test_date     DATE NOT NULL,
  passed        BOOLEAN NOT NULL DEFAULT true,
  expiry_date   DATE,
  document_url  TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_emissions_vehicle ON vehicle_emissions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_emissions_test_date ON vehicle_emissions(test_date DESC);

ALTER TABLE vehicle_emissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle emissions: admin full access" ON vehicle_emissions
  FOR ALL USING (is_admin_role());

CREATE POLICY "Vehicle emissions: drivers insert" ON vehicle_emissions
  FOR INSERT WITH CHECK (
    get_user_role() = 'driver' AND created_by = auth.uid()
    AND vehicle_id IN (SELECT id FROM vehicles WHERE location_id IS NULL OR driver_can_access_location(location_id))
  );

CREATE POLICY "Vehicle emissions: drivers read" ON vehicle_emissions
  FOR SELECT USING (
    get_user_role() = 'driver'
    AND vehicle_id IN (SELECT id FROM vehicles WHERE location_id IS NULL OR driver_can_access_location(location_id))
  );
