DO $$
DECLARE
  target uuid;
BEGIN
  -- Find the gvvov65@gmail.com account
  SELECT id INTO target FROM auth.users WHERE lower(email) = 'gvvov65@gmail.com' LIMIT 1;

  -- Remove every other account (cascades to profiles, roles, orders, notifications)
  DELETE FROM auth.users WHERE id IS DISTINCT FROM target;

  -- Grant admin to the target account if it exists
  IF target IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;