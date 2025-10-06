-- Criar tabela para arquivar logs de auditoria
CREATE TABLE IF NOT EXISTS public.archived_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_log_id uuid NOT NULL,
  gabinete_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action audit_action NOT NULL,
  entity_type audit_entity,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  original_created_at timestamp with time zone NOT NULL,
  archived_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.archived_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins podem ver logs arquivados do gabinete
CREATE POLICY "Admins podem ver logs arquivados do gabinete"
ON public.archived_audit_logs
FOR SELECT
TO authenticated
USING (user_has_gabinete_access(gabinete_id));

-- Sistema pode inserir logs arquivados
CREATE POLICY "Sistema pode arquivar logs"
ON public.archived_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_has_gabinete_access(gabinete_id));

-- Criar índice para melhor performance
CREATE INDEX idx_archived_audit_logs_gabinete ON public.archived_audit_logs(gabinete_id);
CREATE INDEX idx_archived_audit_logs_archived_at ON public.archived_audit_logs(archived_at);