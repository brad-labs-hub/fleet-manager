-- Fix driver vehicle visibility:
-- The app assigns driver access via `driver_assignments` (vehicle assignments),
-- but the original RLS rules used `driver_locations` (location assignments).
-- This migration updates the RLS helper + locations policy so drivers can see
-- vehicles (and joined locations) based on their `driver_assignments`.

-- Re-define the helper used by multiple policies (vehicles, maintenance, insurance, etc.)
CREATE OR REPLACE FUNCTION driver_can_access_location(loc_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM driver_assignments da
    JOIN vehicles v ON v.id = da.vehicle_id
    WHERE da.user_id = auth.uid()
      AND v.location_id = loc_id
  ) OR get_user_role() IN ('employee', 'controller');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update locations policy to align with driver_assignments-backed access
DROP POLICY IF EXISTS "Locations: drivers see assigned" ON locations;

CREATE POLICY "Locations: drivers see assigned" ON locations
  FOR SELECT USING (
    get_user_role() = 'driver' AND
    id IN (
      SELECT v.location_id
      FROM vehicles v
      WHERE v.location_id IS NOT NULL
        AND v.id IN (
          SELECT vehicle_id FROM driver_assignments WHERE user_id = auth.uid()
        )
    )
  );

