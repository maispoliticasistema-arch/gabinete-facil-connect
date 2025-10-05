-- Adicionar coluna para identificar cadastros via link de indicação
ALTER TABLE public.eleitores
ADD COLUMN via_link_indicacao BOOLEAN DEFAULT false;

-- Criar índice para otimizar consultas
CREATE INDEX idx_eleitores_via_link ON public.eleitores(cadastrado_por, via_link_indicacao) WHERE via_link_indicacao = true;