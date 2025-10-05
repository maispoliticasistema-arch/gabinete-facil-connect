-- Criar tabela de erros do sistema
CREATE TABLE public.system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  gabinete_id UUID REFERENCES gabinetes(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_code TEXT,
  stack_trace TEXT,
  context JSONB,
  severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'critical')),
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_agent TEXT,
  page_url TEXT
);

-- Índices para performance
CREATE INDEX idx_system_errors_created_at ON public.system_errors(created_at DESC);
CREATE INDEX idx_system_errors_user_id ON public.system_errors(user_id);
CREATE INDEX idx_system_errors_gabinete_id ON public.system_errors(gabinete_id);
CREATE INDEX idx_system_errors_resolved ON public.system_errors(resolved);

-- Habilitar RLS
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um autenticado pode registrar erros
CREATE POLICY "Usuários podem registrar erros"
ON public.system_errors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: apenas superowners podem ver erros
CREATE POLICY "Superowners podem ver erros"
ON public.system_errors
FOR SELECT
USING (has_system_role(auth.uid(), 'superowner'));

-- Política: apenas superowners podem marcar como resolvido
CREATE POLICY "Superowners podem atualizar erros"
ON public.system_errors
FOR UPDATE
USING (has_system_role(auth.uid(), 'superowner'))
WITH CHECK (has_system_role(auth.uid(), 'superowner'));

-- Função para limpar erros antigos (> 90 dias)
CREATE OR REPLACE FUNCTION public.cleanup_old_errors()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.system_errors
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND resolved = true;
END;
$$;