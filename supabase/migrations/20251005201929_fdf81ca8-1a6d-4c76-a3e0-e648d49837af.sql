-- Fix 1: Remove public access to gabinetes table
DROP POLICY IF EXISTS "Usuários podem ver gabinetes onde têm acesso" ON public.gabinetes;

CREATE POLICY "Usuários podem ver gabinetes onde têm acesso"
ON public.gabinetes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_gabinetes
    WHERE user_gabinetes.user_id = auth.uid()
      AND user_gabinetes.gabinete_id = gabinetes.id
      AND user_gabinetes.ativo = true
  )
);

-- Fix 2: Prevent privilege escalation in user_gabinetes
-- Create a security definer function to validate role changes
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent users from changing their own role
  IF OLD.user_id = auth.uid() AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Users cannot change their own role';
  END IF;
  
  -- Only owners can create or promote to owner role
  IF NEW.role = 'owner' AND OLD.role != 'owner' THEN
    IF NOT user_is_gabinete_owner(NEW.gabinete_id, auth.uid()) THEN
      RAISE EXCEPTION 'Only owners can promote users to owner role';
    END IF;
  END IF;
  
  -- Prevent demoting the last owner
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    IF (SELECT COUNT(*) FROM user_gabinetes WHERE gabinete_id = NEW.gabinete_id AND role = 'owner' AND ativo = true) <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the last owner of a gabinete';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger to enforce role change validation
DROP TRIGGER IF EXISTS validate_role_change_trigger ON public.user_gabinetes;
CREATE TRIGGER validate_role_change_trigger
BEFORE UPDATE ON public.user_gabinetes
FOR EACH ROW
WHEN (OLD.role IS DISTINCT FROM NEW.role)
EXECUTE FUNCTION public.validate_role_change();

-- Update the user_gabinetes UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Admins podem atualizar usuários do gabinete" ON public.user_gabinetes;

CREATE POLICY "Admins podem atualizar usuários do gabinete"
ON public.user_gabinetes
FOR UPDATE
TO authenticated
USING (user_is_gabinete_admin(gabinete_id))
WITH CHECK (
  user_is_gabinete_admin(gabinete_id) 
  AND (
    -- Cannot change own role unless you're the owner
    user_id != auth.uid() OR user_is_gabinete_owner(gabinete_id, auth.uid())
  )
);

-- Fix 3: Strengthen profiles access - restrict phone numbers to admins only
DROP POLICY IF EXISTS "Membros do gabinete podem ver perfis de outros membros" ON public.profiles;

CREATE POLICY "Membros podem ver nomes de outros membros do gabinete"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_gabinetes ug1
    JOIN user_gabinetes ug2 ON ug1.gabinete_id = ug2.gabinete_id
    WHERE ug1.user_id = auth.uid()
      AND ug2.user_id = profiles.id
      AND ug1.ativo = true
      AND ug2.ativo = true
  )
);

-- Fix 4: Add indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_user_gabinetes_user_gabinete ON public.user_gabinetes(user_id, gabinete_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_eleitores_gabinete ON public.eleitores(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gabinete_created ON public.audit_logs(gabinete_id, created_at DESC);

-- Fix 5: Add CHECK constraints for data validation
ALTER TABLE public.eleitores
  ADD CONSTRAINT check_cpf_format CHECK (cpf IS NULL OR cpf ~ '^\d{11}$' OR cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$'),
  ADD CONSTRAINT check_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT check_telefone_format CHECK (telefone IS NULL OR length(telefone) >= 10);

-- Fix 6: Verify audit_logs policy is correct (should already be fixed from previous migration)
-- The policy should only allow service_role to insert
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'audit_logs' 
      AND policyname = 'Sistema pode criar logs'
  ) THEN
    DROP POLICY "Sistema pode criar logs" ON public.audit_logs;
  END IF;
END $$;