-- 1. Privilege functions: remove email-spoofable admin grant, require confirmed email for helper match
CREATE OR REPLACE FUNCTION public.current_email()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT email FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT public.has_role(auth.uid(), 'admin')
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.admin_helpers
      WHERE email IS NOT NULL AND email = public.current_email()
    )
$function$;

-- 2. Lock down function execution: revoke from anon/public everywhere; keep authenticated only where RLS needs it
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_email() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- 3. Storage: restrict uploads bucket writes to owner's folder (or staff)
DROP POLICY IF EXISTS "uploads authed insert" ON storage.objects;
DROP POLICY IF EXISTS "uploads authed update" ON storage.objects;
DROP POLICY IF EXISTS "uploads authed delete" ON storage.objects;

CREATE POLICY "uploads owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'uploads'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff())
  );

CREATE POLICY "uploads owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff())
  )
  WITH CHECK (
    bucket_id = 'uploads'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff())
  );

CREATE POLICY "uploads owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'uploads'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff())
  );