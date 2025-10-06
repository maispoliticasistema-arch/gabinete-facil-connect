-- ==========================================
-- SECURITY FIXES - CRITICAL
-- ==========================================

-- 1. Criar tabela para rate limiting de cadastros públicos
CREATE TABLE IF NOT EXISTS public.registration_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_rate_limits_ip ON public.registration_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_registration_rate_limits_blocked ON public.registration_rate_limits(blocked_until);

-- 2. Criar tabela para rate limiting de formulários
CREATE TABLE IF NOT EXISTS public.form_submission_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  form_id TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_rate_limits_ip ON public.form_submission_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_form_rate_limits_blocked ON public.form_submission_rate_limits(blocked_until);

-- 3. Função para validar cadastro público com rate limiting
CREATE OR REPLACE FUNCTION public.validate_public_registration(
  _gabinete_id UUID,
  _cadastrado_por UUID,
  _ip_address TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rate_limit_record RECORD;
  max_attempts INTEGER := 5;
  time_window INTERVAL := INTERVAL '1 hour';
BEGIN
  -- Verificar se o usuário tem acesso ao gabinete
  IF NOT EXISTS (
    SELECT 1 FROM user_gabinetes 
    WHERE user_id = _cadastrado_por 
      AND gabinete_id = _gabinete_id 
      AND ativo = true
  ) THEN
    RAISE EXCEPTION 'Usuário não tem acesso ao gabinete';
  END IF;

  -- Se temos IP, verificar rate limiting
  IF _ip_address IS NOT NULL THEN
    SELECT * INTO rate_limit_record
    FROM registration_rate_limits
    WHERE ip_address = _ip_address
      AND gabinete_id = _gabinete_id
      AND first_attempt_at > NOW() - time_window;

    -- Se encontrou registro, verificar se está bloqueado
    IF FOUND THEN
      IF rate_limit_record.blocked_until IS NOT NULL 
         AND rate_limit_record.blocked_until > NOW() THEN
        RAISE EXCEPTION 'IP bloqueado temporariamente. Tente novamente mais tarde.';
      END IF;

      -- Se atingiu o limite, bloquear
      IF rate_limit_record.attempts >= max_attempts THEN
        UPDATE registration_rate_limits
        SET blocked_until = NOW() + INTERVAL '1 hour',
            last_attempt_at = NOW()
        WHERE id = rate_limit_record.id;
        
        RAISE EXCEPTION 'Limite de cadastros excedido. IP bloqueado por 1 hora.';
      END IF;

      -- Incrementar tentativas
      UPDATE registration_rate_limits
      SET attempts = attempts + 1,
          last_attempt_at = NOW()
      WHERE id = rate_limit_record.id;
    ELSE
      -- Criar novo registro
      INSERT INTO registration_rate_limits (ip_address, gabinete_id)
      VALUES (_ip_address, _gabinete_id);
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

-- 4. Funções para mascarar dados sensíveis
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF cpf IS NULL OR LENGTH(cpf) < 11 THEN
    RETURN NULL;
  END IF;
  -- Retorna apenas os 3 primeiros dígitos e mascara o resto: 123.***.***-**
  RETURN SUBSTRING(cpf FROM 1 FOR 3) || '.***.***-**';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_rg(rg TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF rg IS NULL OR LENGTH(rg) < 4 THEN
    RETURN NULL;
  END IF;
  -- Retorna apenas os 2 primeiros dígitos e mascara o resto: 12.***.**-*
  RETURN SUBSTRING(rg FROM 1 FOR 2) || '.***.**-*';
END;
$$;

-- 5. Corrigir políticas de user_permissions para evitar auto-atribuição
DROP POLICY IF EXISTS "Admins podem gerenciar permissões do gabinete" ON public.user_permissions;

CREATE POLICY "Admins podem gerenciar permissões do gabinete"
ON public.user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_gabinetes ug
    JOIN user_gabinetes my_ug ON my_ug.gabinete_id = ug.gabinete_id
    WHERE ug.id = user_permissions.user_gabinete_id
      AND my_ug.user_id = auth.uid()
      AND my_ug.role IN ('owner', 'admin')
      -- CRÍTICO: Não pode ser o próprio usuário
      AND ug.user_id != auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_gabinetes ug
    JOIN user_gabinetes my_ug ON my_ug.gabinete_id = ug.gabinete_id
    WHERE ug.id = user_permissions.user_gabinete_id
      AND my_ug.user_id = auth.uid()
      AND my_ug.role IN ('owner', 'admin')
      -- CRÍTICO: Não pode ser o próprio usuário
      AND ug.user_id != auth.uid()
  )
);

-- 6. Adicionar trigger para prevenir auto-modificação de permissões
CREATE OR REPLACE FUNCTION public.prevent_self_permission_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Obter o user_id do user_gabinete sendo modificado
  SELECT user_id INTO target_user_id
  FROM user_gabinetes
  WHERE id = NEW.user_gabinete_id;

  -- Prevenir auto-modificação
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Usuários não podem modificar suas próprias permissões';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_self_permission_modification ON public.user_permissions;
CREATE TRIGGER prevent_self_permission_modification
  BEFORE INSERT OR UPDATE ON public.user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_permission_modification();

-- 7. Melhorar política de cadastro público de eleitores
DROP POLICY IF EXISTS "Cadastros públicos via link de indicação" ON public.eleitores;

CREATE POLICY "Cadastros públicos via link de indicação"
ON public.eleitores
FOR INSERT
TO authenticated
WITH CHECK (
  -- Validar usando função de segurança
  validate_public_registration(gabinete_id, cadastrado_por)
  AND via_link_indicacao = true
  AND EXISTS (
    SELECT 1
    FROM user_gabinetes ug
    WHERE ug.user_id = cadastrado_por
      AND ug.gabinete_id = eleitores.gabinete_id
      AND ug.ativo = true
  )
);

-- 8. RLS para tabelas de rate limiting (apenas sistema pode inserir)
ALTER TABLE public.registration_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submission_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sistema pode gerenciar rate limits de registro"
ON public.registration_rate_limits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Sistema pode gerenciar rate limits de formulário"
ON public.form_submission_rate_limits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 9. Função para limpar rate limits antigos (executar via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar registros de mais de 24 horas
  DELETE FROM registration_rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';

  DELETE FROM form_submission_rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 10. Adicionar validação extra no trigger de role change
DROP TRIGGER IF EXISTS validate_role_change ON public.user_gabinetes;

CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  executor_role user_role;
BEGIN
  -- Prevenir usuários de mudarem seu próprio role
  IF OLD.user_id = auth.uid() AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Usuários não podem alterar seu próprio cargo';
  END IF;
  
  -- Apenas owners podem criar ou promover para owner
  IF NEW.role = 'owner' AND OLD.role != 'owner' THEN
    IF NOT user_is_gabinete_owner(NEW.gabinete_id, auth.uid()) THEN
      RAISE EXCEPTION 'Apenas proprietários podem promover usuários a proprietário';
    END IF;
  END IF;
  
  -- Prevenir rebaixamento do último owner
  IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
    IF (SELECT COUNT(*) FROM user_gabinetes 
        WHERE gabinete_id = NEW.gabinete_id 
          AND role = 'owner' 
          AND ativo = true) <= 1 THEN
      RAISE EXCEPTION 'Não é possível rebaixar o último proprietário do gabinete';
    END IF;
  END IF;
  
  -- Prevenir que assessores promovam usuários
  IF TG_OP = 'UPDATE' THEN
    SELECT role INTO executor_role
    FROM user_gabinetes
    WHERE user_id = auth.uid()
      AND gabinete_id = NEW.gabinete_id
      AND ativo = true
    LIMIT 1;
    
    IF executor_role = 'assessor' THEN
      RAISE EXCEPTION 'Assessores não podem alterar cargos de usuários';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_role_change
  BEFORE UPDATE ON public.user_gabinetes
  FOR EACH ROW
  EXECUTE FUNCTION validate_role_change();