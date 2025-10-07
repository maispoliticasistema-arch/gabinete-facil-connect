-- Expandir tabela de audit_logs para incluir mais informações
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS http_method TEXT,
ADD COLUMN IF NOT EXISTS request_body JSONB,
ADD COLUMN IF NOT EXISTS response_status INTEGER;

-- Criar tabela específica para tentativas de autenticação
CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

-- Superowners podem ver todas as tentativas de autenticação
CREATE POLICY "Superowners podem ver tentativas de auth"
ON public.auth_attempts
FOR SELECT
TO authenticated
USING (has_system_role(auth.uid(), 'superowner'::system_role));

-- Sistema pode inserir tentativas de autenticação
CREATE POLICY "Sistema pode inserir tentativas de auth"
ON public.auth_attempts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email ON public.auth_attempts(email);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_created_at ON public.auth_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_success ON public.auth_attempts(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_gabinete ON public.audit_logs(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON public.system_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_severity ON public.system_errors(severity);

-- Função para limpar logs antigos de autenticação (manter 90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_auth_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_attempts
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;