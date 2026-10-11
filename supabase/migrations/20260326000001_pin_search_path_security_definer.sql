-- Harden SECURITY DEFINER helper functions against search_path injection.
-- Without a pinned search_path, a caller can prepend a schema containing
-- malicious objects (e.g. a fake user_profiles table) and have it resolved
-- with the definer's elevated privileges. Pin search_path = '' and fully
-- schema-qualify every referenced object. Flagged by the Supabase linter.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_controller()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'controller'
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('employee', 'controller')
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

-- Keep the latest (compat) definition that honors both driver_assignments
-- and driver_locations, now with a pinned search_path.
CREATE OR REPLACE FUNCTION public.driver_can_access_location(loc_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.driver_assignments da
      JOIN public.vehicles v ON v.id = da.vehicle_id
      WHERE da.user_id = auth.uid()
        AND v.location_id = loc_id
    )
    OR
    EXISTS (
      SELECT 1
      FROM public.driver_locations dl
      WHERE dl.user_id = auth.uid()
        AND dl.location_id = loc_id
    )
    OR
    public.get_user_role() IN ('employee', 'controller');
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'driver'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
