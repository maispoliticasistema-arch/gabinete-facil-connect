-- Corrigir política de INSERT em gabinetes
-- Remover política antiga
DROP POLICY IF EXISTS "Usuários podem criar seus próprios gabinetes" ON public.gabinetes;

-- Criar nova política que permite inserção quando o usuário está autenticado
CREATE POLICY "Usuários autenticados podem criar gabinetes"
ON public.gabinetes
FOR INSERT
TO authenticated
WITH CHECK (true);