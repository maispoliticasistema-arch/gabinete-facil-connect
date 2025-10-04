-- Tornar eleitor_id obrigatório, já que sempre vincularemos a um eleitor
-- Atualizar registros existentes que possam ter eleitor_id null (se houver)
UPDATE public.roteiro_pontos 
SET eleitor_id = (SELECT id FROM public.eleitores LIMIT 1)
WHERE eleitor_id IS NULL;

-- Tornar a coluna NOT NULL
ALTER TABLE public.roteiro_pontos 
ALTER COLUMN eleitor_id SET NOT NULL;