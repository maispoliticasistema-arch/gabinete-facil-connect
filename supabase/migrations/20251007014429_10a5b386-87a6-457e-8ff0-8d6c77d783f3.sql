-- Criar tabela de níveis de envolvimento
CREATE TABLE public.niveis_envolvimento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT NOT NULL DEFAULT '#6366f1',
  ordem INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índice
CREATE INDEX idx_niveis_envolvimento_gabinete ON public.niveis_envolvimento(gabinete_id);

-- Habilitar RLS
ALTER TABLE public.niveis_envolvimento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver níveis do seu gabinete"
  ON public.niveis_envolvimento
  FOR SELECT
  USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Admins podem criar níveis"
  ON public.niveis_envolvimento
  FOR INSERT
  WITH CHECK (user_has_gabinete_access(gabinete_id) AND user_is_gabinete_admin(gabinete_id));

CREATE POLICY "Admins podem atualizar níveis"
  ON public.niveis_envolvimento
  FOR UPDATE
  USING (user_has_gabinete_access(gabinete_id) AND user_is_gabinete_admin(gabinete_id));

CREATE POLICY "Admins podem deletar níveis"
  ON public.niveis_envolvimento
  FOR DELETE
  USING (user_has_gabinete_access(gabinete_id) AND user_is_gabinete_admin(gabinete_id));

-- Adicionar coluna nivel_envolvimento_id na tabela eleitores
ALTER TABLE public.eleitores 
ADD COLUMN nivel_envolvimento_id UUID REFERENCES public.niveis_envolvimento(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX idx_eleitores_nivel_envolvimento ON public.eleitores(nivel_envolvimento_id);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_niveis_envolvimento_updated_at
  BEFORE UPDATE ON public.niveis_envolvimento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();