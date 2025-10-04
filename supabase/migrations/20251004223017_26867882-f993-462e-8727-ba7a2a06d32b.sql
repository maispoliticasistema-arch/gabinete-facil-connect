-- Adicionar campos extras na tabela gabinetes
ALTER TABLE public.gabinetes 
ADD COLUMN IF NOT EXISTS slogan text;

-- Criar enum para tipos de permissões
CREATE TYPE public.permission_type AS ENUM (
  'view_eleitores',
  'create_eleitores',
  'edit_eleitores',
  'delete_eleitores',
  'view_demandas',
  'create_demandas',
  'edit_demandas',
  'delete_demandas',
  'view_agenda',
  'create_agenda',
  'edit_agenda',
  'delete_agenda',
  'view_roteiros',
  'create_roteiros',
  'edit_roteiros',
  'delete_roteiros',
  'view_relatorios',
  'manage_users',
  'manage_settings'
);

-- Criar tabela de permissões personalizadas
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_gabinete_id uuid NOT NULL REFERENCES public.user_gabinetes(id) ON DELETE CASCADE,
  permission permission_type NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_gabinete_id, permission)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para permissões
CREATE POLICY "Admins podem ver permissões do gabinete"
ON public.user_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_gabinetes ug
    JOIN public.user_gabinetes my_ug ON my_ug.gabinete_id = ug.gabinete_id
    WHERE ug.id = user_permissions.user_gabinete_id
    AND my_ug.user_id = auth.uid()
    AND my_ug.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins podem gerenciar permissões do gabinete"
ON public.user_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_gabinetes ug
    JOIN public.user_gabinetes my_ug ON my_ug.gabinete_id = ug.gabinete_id
    WHERE ug.id = user_permissions.user_gabinete_id
    AND my_ug.user_id = auth.uid()
    AND my_ug.role IN ('owner', 'admin')
  )
);

-- Criar enum para tipos de ação de auditoria
CREATE TYPE public.audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'permission_change',
  'user_created',
  'user_disabled',
  'user_deleted'
);

-- Criar enum para entidades auditadas
CREATE TYPE public.audit_entity AS ENUM (
  'eleitor',
  'demanda',
  'agenda',
  'roteiro',
  'tag',
  'user',
  'gabinete',
  'permission'
);

-- Criar tabela de logs de auditoria
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action audit_action NOT NULL,
  entity_type audit_entity,
  entity_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para logs de auditoria
CREATE POLICY "Admins podem ver logs do gabinete"
ON public.audit_logs
FOR SELECT
USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Sistema pode criar logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Nenhum usuário pode deletar ou atualizar logs diretamente

-- Criar tabela de integrações
CREATE TABLE public.gabinete_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  integration_type text NOT NULL,
  config jsonb,
  is_active boolean DEFAULT false,
  last_sync timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(gabinete_id, integration_type)
);

ALTER TABLE public.gabinete_integrations ENABLE ROW LEVEL SECURITY;

-- Políticas para integrações
CREATE POLICY "Admins podem ver integrações do gabinete"
ON public.gabinete_integrations
FOR SELECT
USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Admins podem gerenciar integrações"
ON public.gabinete_integrations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_gabinetes
    WHERE user_id = auth.uid()
    AND gabinete_id = gabinete_integrations.gabinete_id
    AND role IN ('owner', 'admin')
  )
);

-- Criar tabela de preferências de notificação
CREATE TABLE public.user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  gabinete_id uuid NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  internal_notifications boolean DEFAULT true,
  deadline_reminders boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, gabinete_id)
);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para preferências de notificação
CREATE POLICY "Usuários podem ver suas preferências"
ON public.user_notification_preferences
FOR SELECT
USING (user_id = auth.uid() AND user_has_gabinete_access(gabinete_id));

CREATE POLICY "Usuários podem gerenciar suas preferências"
ON public.user_notification_preferences
FOR ALL
USING (user_id = auth.uid() AND user_has_gabinete_access(gabinete_id));

-- Atualizar função de update_updated_at para novas tabelas
CREATE TRIGGER update_gabinete_integrations_updated_at
BEFORE UPDATE ON public.gabinete_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
BEFORE UPDATE ON public.user_notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para melhor performance
CREATE INDEX idx_audit_logs_gabinete ON public.audit_logs(gabinete_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX idx_user_permissions_gabinete ON public.user_permissions(user_gabinete_id);

-- Função helper para verificar permissões específicas
CREATE OR REPLACE FUNCTION public.user_has_permission(
  _gabinete_id uuid,
  _permission permission_type
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_gabinetes ug
    LEFT JOIN public.user_permissions up ON up.user_gabinete_id = ug.id
    WHERE ug.user_id = auth.uid()
      AND ug.gabinete_id = _gabinete_id
      AND ug.ativo = true
      AND (
        ug.role IN ('owner', 'admin') -- Owners e admins têm todas as permissões
        OR up.permission = _permission -- Ou tem a permissão específica
      )
  )
$$;

-- Função para registrar ações no log de auditoria
CREATE OR REPLACE FUNCTION public.log_audit_action(
  _gabinete_id uuid,
  _action audit_action,
  _entity_type audit_entity DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    gabinete_id,
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    _gabinete_id,
    auth.uid(),
    _action,
    _entity_type,
    _entity_id,
    _details
  );
END;
$$;