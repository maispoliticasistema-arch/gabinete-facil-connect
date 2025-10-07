-- DESABILITAR RLS COMPLETAMENTE NA TABELA GABINETES
ALTER TABLE public.gabinetes DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Permitir criação de gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Anônimos podem criar gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Permitir visualização de gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Permitir atualização de gabinetes" ON public.gabinetes;
DROP POLICY IF EXISTS "Superowners visualizam tudo" ON public.gabinetes;