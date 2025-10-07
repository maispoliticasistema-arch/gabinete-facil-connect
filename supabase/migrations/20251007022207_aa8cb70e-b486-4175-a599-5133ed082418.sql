-- Adicionar código único aos gabinetes
ALTER TABLE public.gabinetes 
ADD COLUMN codigo_convite TEXT UNIQUE;

-- Função para gerar código único de convite
CREATE OR REPLACE FUNCTION public.generate_codigo_convite()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Gera código aleatório de 8 caracteres maiúsculos
    codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    
    -- Verifica se já existe
    SELECT EXISTS(SELECT 1 FROM gabinetes WHERE codigo_convite = codigo) INTO existe;
    
    -- Se não existe, retorna o código
    IF NOT existe THEN
      RETURN codigo;
    END IF;
  END LOOP;
END;
$$;

-- Trigger para definir código de convite ao criar gabinete
CREATE OR REPLACE FUNCTION public.set_codigo_convite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.codigo_convite IS NULL THEN
    NEW.codigo_convite := generate_codigo_convite();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_codigo_convite
BEFORE INSERT ON public.gabinetes
FOR EACH ROW
EXECUTE FUNCTION public.set_codigo_convite();

-- Atualizar gabinetes existentes com código
UPDATE public.gabinetes 
SET codigo_convite = generate_codigo_convite() 
WHERE codigo_convite IS NULL;

-- Tabela de solicitações de acesso ao gabinete
CREATE TABLE public.gabinete_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  mensagem TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMP WITH TIME ZONE,
  UNIQUE(gabinete_id, user_id)
);

-- Enable RLS
ALTER TABLE public.gabinete_access_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para solicitações de acesso
-- Usuários podem criar suas próprias solicitações
CREATE POLICY "Usuários podem criar solicitações de acesso"
ON public.gabinete_access_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Usuários podem ver suas próprias solicitações
CREATE POLICY "Usuários podem ver suas próprias solicitações"
ON public.gabinete_access_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins do gabinete podem ver todas as solicitações
CREATE POLICY "Admins podem ver solicitações do gabinete"
ON public.gabinete_access_requests
FOR SELECT
TO authenticated
USING (user_is_gabinete_admin(gabinete_id));

-- Admins podem atualizar solicitações (aprovar/rejeitar)
CREATE POLICY "Admins podem atualizar solicitações"
ON public.gabinete_access_requests
FOR UPDATE
TO authenticated
USING (user_is_gabinete_admin(gabinete_id));

-- Trigger para updated_at
CREATE TRIGGER update_gabinete_access_requests_updated_at
BEFORE UPDATE ON public.gabinete_access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para aprovar solicitação de acesso
CREATE OR REPLACE FUNCTION public.approve_access_request(
  request_id UUID,
  assigned_role user_role DEFAULT 'assessor'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Buscar a solicitação
  SELECT * INTO request_record
  FROM gabinete_access_requests
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  
  -- Verificar se usuário tem permissão (é admin do gabinete)
  IF NOT user_is_gabinete_admin(request_record.gabinete_id) THEN
    RAISE EXCEPTION 'Sem permissão para aprovar solicitações';
  END IF;
  
  -- Verificar se já não está aprovada
  IF request_record.status = 'aprovado' THEN
    RAISE EXCEPTION 'Solicitação já foi aprovada';
  END IF;
  
  -- Adicionar usuário ao gabinete
  INSERT INTO user_gabinetes (user_id, gabinete_id, role, ativo)
  VALUES (request_record.user_id, request_record.gabinete_id, assigned_role, true)
  ON CONFLICT (user_id, gabinete_id) 
  DO UPDATE SET ativo = true, role = assigned_role;
  
  -- Atualizar status da solicitação
  UPDATE gabinete_access_requests
  SET status = 'aprovado',
      aprovado_por = auth.uid(),
      aprovado_em = now()
  WHERE id = request_id;
  
  -- Criar notificação para o solicitante
  PERFORM create_notification(
    request_record.user_id,
    request_record.gabinete_id,
    'info',
    'Solicitação Aprovada',
    'Sua solicitação de acesso ao gabinete foi aprovada!'
  );
END;
$$;

-- Função para rejeitar solicitação de acesso
CREATE OR REPLACE FUNCTION public.reject_access_request(request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Buscar a solicitação
  SELECT * INTO request_record
  FROM gabinete_access_requests
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;
  
  -- Verificar se usuário tem permissão
  IF NOT user_is_gabinete_admin(request_record.gabinete_id) THEN
    RAISE EXCEPTION 'Sem permissão para rejeitar solicitações';
  END IF;
  
  -- Atualizar status
  UPDATE gabinete_access_requests
  SET status = 'rejeitado',
      aprovado_por = auth.uid(),
      aprovado_em = now()
  WHERE id = request_id;
  
  -- Criar notificação
  PERFORM create_notification(
    request_record.user_id,
    request_record.gabinete_id,
    'warning',
    'Solicitação Recusada',
    'Sua solicitação de acesso ao gabinete foi recusada.'
  );
END;
$$;