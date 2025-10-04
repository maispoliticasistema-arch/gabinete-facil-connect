-- Adicionar campos de endereço de partida e final na tabela roteiros
ALTER TABLE public.roteiros 
ADD COLUMN endereco_partida TEXT,
ADD COLUMN endereco_final TEXT,
ADD COLUMN latitude_partida NUMERIC,
ADD COLUMN longitude_partida NUMERIC,
ADD COLUMN latitude_final NUMERIC,
ADD COLUMN longitude_final NUMERIC;

-- Atualizar a tabela roteiro_pontos para aceitar endereços manuais completos
ALTER TABLE public.roteiro_pontos
ADD COLUMN nome_pessoa TEXT;