-- Drop the overly permissive audit logs INSERT policy
DROP POLICY IF EXISTS "Sistema pode criar logs" ON public.audit_logs;

-- Create a restricted policy that only allows service role to insert
-- This is needed for edge functions using the admin client
CREATE POLICY "Apenas service role pode inserir logs diretamente"
ON public.audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Regular users should use the log_audit_action() function which is SECURITY DEFINER
-- and will bypass RLS while enforcing proper user_id from auth.uid()

-- Ensure the log_audit_action function exists and grant execute permission
GRANT EXECUTE ON FUNCTION public.log_audit_action TO authenticated;