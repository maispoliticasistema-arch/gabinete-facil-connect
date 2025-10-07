-- Adicionar campos complemento e sexo na tabela eleitores
ALTER TABLE public.eleitores 
ADD COLUMN IF NOT EXISTS complemento text,
ADD COLUMN IF NOT EXISTS sexo text CHECK (sexo IN ('masculino', 'feminino', NULL));