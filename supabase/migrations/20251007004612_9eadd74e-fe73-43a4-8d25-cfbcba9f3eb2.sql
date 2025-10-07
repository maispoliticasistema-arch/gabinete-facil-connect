-- Criar tabela para armazenar criadores externos e seus mapeamentos
CREATE TABLE IF NOT EXISTS public.criadores_externos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gabinete_id UUID NOT NULL REFERENCES public.gabinetes(id) ON DELETE CASCADE,
  nome_externo TEXT NOT NULL,
  user_id_mapeado UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(gabinete_id, nome_externo)
);

-- Adicionar coluna na tabela eleitores para referenciar criador externo
ALTER TABLE public.eleitores
ADD COLUMN IF NOT EXISTS criador_externo_id UUID REFERENCES public.criadores_externos(id) ON DELETE SET NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_criadores_externos_gabinete ON public.criadores_externos(gabinete_id);
CREATE INDEX IF NOT EXISTS idx_criadores_externos_mapeado ON public.criadores_externos(user_id_mapeado);
CREATE INDEX IF NOT EXISTS idx_eleitores_criador_externo ON public.eleitores(criador_externo_id);

-- Habilitar RLS
ALTER TABLE public.criadores_externos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para criadores_externos
CREATE POLICY "Usuários podem ver criadores externos do seu gabinete"
  ON public.criadores_externos FOR SELECT
  USING (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Sistema pode criar criadores externos durante importação"
  ON public.criadores_externos FOR INSERT
  WITH CHECK (user_has_gabinete_access(gabinete_id));

CREATE POLICY "Admins podem atualizar mapeamentos de criadores externos"
  ON public.criadores_externos FOR UPDATE
  USING (user_has_gabinete_access(gabinete_id) AND user_is_gabinete_admin(gabinete_id));

CREATE POLICY "Admins podem deletar criadores externos"
  ON public.criadores_externos FOR DELETE
  USING (user_has_gabinete_access(gabinete_id) AND user_is_gabinete_admin(gabinete_id));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_criadores_externos_updated_at
  BEFORE UPDATE ON public.criadores_externos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();