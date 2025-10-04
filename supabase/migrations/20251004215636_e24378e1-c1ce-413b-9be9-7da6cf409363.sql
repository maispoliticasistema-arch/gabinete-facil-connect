-- Criar tabela para relacionamento many-to-many entre roteiros e responsáveis
CREATE TABLE public.roteiro_responsaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roteiro_id UUID NOT NULL REFERENCES public.roteiros(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(roteiro_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.roteiro_responsaveis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver responsáveis dos roteiros dos seus gabinetes"
ON public.roteiro_responsaveis
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.roteiros
    WHERE roteiros.id = roteiro_responsaveis.roteiro_id
      AND user_has_gabinete_access(roteiros.gabinete_id)
  )
);

CREATE POLICY "Usuários podem adicionar responsáveis aos roteiros dos seus gabinetes"
ON public.roteiro_responsaveis
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.roteiros
    WHERE roteiros.id = roteiro_responsaveis.roteiro_id
      AND user_has_gabinete_access(roteiros.gabinete_id)
  )
);

CREATE POLICY "Usuários podem remover responsáveis dos roteiros dos seus gabinetes"
ON public.roteiro_responsaveis
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.roteiros
    WHERE roteiros.id = roteiro_responsaveis.roteiro_id
      AND user_has_gabinete_access(roteiros.gabinete_id)
  )
);

-- Criar índices para performance
CREATE INDEX idx_roteiro_responsaveis_roteiro_id ON public.roteiro_responsaveis(roteiro_id);
CREATE INDEX idx_roteiro_responsaveis_user_id ON public.roteiro_responsaveis(user_id);