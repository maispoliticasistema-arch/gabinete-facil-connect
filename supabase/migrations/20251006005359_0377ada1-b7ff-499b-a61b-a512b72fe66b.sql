-- Desabilitar RLS na tabela gabinetes temporariamente
-- para permitir criação durante o setup inicial

ALTER TABLE gabinetes DISABLE ROW LEVEL SECURITY;

-- Manter RLS nas outras tabelas relacionadas
-- pois user_gabinetes precisa de proteção