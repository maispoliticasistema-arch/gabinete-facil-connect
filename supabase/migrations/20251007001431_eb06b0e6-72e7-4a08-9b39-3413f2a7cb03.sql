-- Remover a política atual de INSERT
DROP POLICY IF EXISTS "Permitir criação de gabinetes" ON public.gabinetes;

-- Criar política simples para INSERT - usuários autenticados podem criar
CREATE POLICY "Permitir criação de gabinetes"
ON public.gabinetes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Adicionar também para anônimos caso necessário
CREATE POLICY "Anônimos podem criar gabinetes"
ON public.gabinetes
FOR INSERT
TO anon
WITH CHECK (true);