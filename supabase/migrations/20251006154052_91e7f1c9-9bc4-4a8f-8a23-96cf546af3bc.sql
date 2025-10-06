-- Permitir que superowners vejam todos os audit logs do sistema
CREATE POLICY "Superowners podem ver todos os audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'superowner'));