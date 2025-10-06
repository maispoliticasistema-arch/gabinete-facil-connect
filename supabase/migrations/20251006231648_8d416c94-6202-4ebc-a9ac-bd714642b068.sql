-- Criar tabela para templates de permissões
CREATE TABLE IF NOT EXISTS public.permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(gabinete_id, nome)
);

-- Criar tabela para as permissões de cada template
CREATE TABLE IF NOT EXISTS public.permission_template_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.permission_templates(id) ON DELETE CASCADE,
  permission permission_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, permission)
);

-- Habilitar RLS
ALTER TABLE public.permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_template_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para permission_templates
CREATE POLICY "Usuários podem ver templates do seu gabinete"
  ON public.permission_templates
  FOR SELECT
  USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Admins podem criar templates"
  ON public.permission_templates
  FOR INSERT
  WITH CHECK (
    user_has_gabinete_access(gabinete_id) AND 
    user_is_gabinete_admin(gabinete_id)
  );

CREATE POLICY "Admins podem atualizar templates"
  ON public.permission_templates
  FOR UPDATE
  USING (
    user_has_gabinete_access(gabinete_id) AND 
    user_is_gabinete_admin(gabinete_id)
  );

CREATE POLICY "Admins podem deletar templates"
  ON public.permission_templates
  FOR DELETE
  USING (
    user_has_gabinete_access(gabinete_id) AND 
    user_is_gabinete_admin(gabinete_id)
  );

-- Políticas para permission_template_permissions
CREATE POLICY "Usuários podem ver permissões dos templates do seu gabinete"
  ON public.permission_template_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.permission_templates
      WHERE id = permission_template_permissions.template_id
        AND user_has_gabinete_access(gabinete_id)
    )
  );

CREATE POLICY "Admins podem criar permissões de templates"
  ON public.permission_template_permissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.permission_templates
      WHERE id = permission_template_permissions.template_id
        AND user_has_gabinete_access(gabinete_id)
        AND user_is_gabinete_admin(gabinete_id)
    )
  );

CREATE POLICY "Admins podem deletar permissões de templates"
  ON public.permission_template_permissions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.permission_templates
      WHERE id = permission_template_permissions.template_id
        AND user_has_gabinete_access(gabinete_id)
        AND user_is_gabinete_admin(gabinete_id)
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_permission_templates_updated_at
  BEFORE UPDATE ON public.permission_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();