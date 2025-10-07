-- Remover política antiga de insert
DROP POLICY IF EXISTS "Usuários autenticados podem criar gabinetes" ON public.gabinetes;

-- Permitir que qualquer pessoa (mesmo não autenticada) crie gabinetes
CREATE POLICY "Qualquer pessoa pode criar gabinetes"
ON public.gabinetes
FOR INSERT
WITH CHECK (true);