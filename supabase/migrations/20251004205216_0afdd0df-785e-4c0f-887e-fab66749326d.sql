-- Remover o campo nome_pessoa da tabela roteiro_pontos, pois não será mais usado
-- Sempre vamos vincular a um eleitor, mesmo quando o endereço for alternativo
ALTER TABLE public.roteiro_pontos DROP COLUMN IF EXISTS nome_pessoa;