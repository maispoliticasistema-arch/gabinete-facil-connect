-- Criar tabela para armazenar submissões de formulários do portal
CREATE TABLE public.portal_form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  form_title TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_portal_form_submissions_gabinete ON public.portal_form_submissions(gabinete_id);
CREATE INDEX idx_portal_form_submissions_form_id ON public.portal_form_submissions(form_id);
CREATE INDEX idx_portal_form_submissions_created_at ON public.portal_form_submissions(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.portal_form_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Qualquer um pode submeter formulários"
ON public.portal_form_submissions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Usuários podem ver submissões do seu gabinete"
ON public.portal_form_submissions
FOR SELECT
USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Admins podem deletar submissões"
ON public.portal_form_submissions
FOR DELETE
USING (user_has_gabinete_access(gabinete_id) AND user_is_gabinete_admin(gabinete_id));

-- Trigger para updated_at
CREATE TRIGGER update_portal_form_submissions_updated_at
BEFORE UPDATE ON public.portal_form_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();