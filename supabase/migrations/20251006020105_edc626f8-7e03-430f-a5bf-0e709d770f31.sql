-- Permitir que admins do gabinete possam deletar logs de auditoria
CREATE POLICY "Admins podem deletar logs do gabinete"
ON public.audit_logs
FOR DELETE
TO authenticated
USING (user_is_gabinete_admin(gabinete_id));